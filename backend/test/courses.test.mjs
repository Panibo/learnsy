import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMitCourseSource, fetchMitCourses, normalizeMitCourse } from '../dist/courses/mit.js';
import { createApiServer } from '../dist/server.js';

const raw = (id = 1) => ({
  id, title: `Climate course ${id}`, description: 'Study climate and energy.', published: true,
  platform: { code: 'ocw' }, resource_type: 'course',
  topics: [{ name: 'Energy, Climate & Sustainability' }, { name: 'Climate Science' }],
  url: `https://ocw.mit.edu/courses/climate-${id}/`, best_run_id: id,
  runs: [{ id, published: true, semester: 'Fall', year: 2020, level: [{ name: 'Graduate' }], instructors: [{ full_name: 'Test Instructor' }] }],
  course_feature: ['Lecture Notes'], course: { course_numbers: [{ value: '1.001' }] }, license_cc: true,
});
const page = (results, next = null) => new Response(JSON.stringify({ results, next }), { headers: { 'Content-Type': 'application/json' } });

test('maps MIT metadata and leaves missing workload and language unknown', () => {
  const mapped = normalizeMitCourse(raw());
  assert.equal(mapped.source.providerName, 'MIT OpenCourseWare');
  assert.equal(mapped.level, 'Graduate');
  assert.equal(mapped.term, 'Fall 2020');
  assert.equal(mapped.durationWeeks, null);
  assert.equal(mapped.hoursPerWeek, null);
  assert.equal(mapped.language, null);
  assert.deepEqual(mapped.materials, ['Lecture Notes']);
  for (const patch of [{ platform: { code: 'mitx' } }, { resource_type: 'video' }, { published: false }, { topics: [{ name: 'Music' }] }, { url: 'https://example.com/courses/a/' }, { url: 'javascript:alert(1)' }, { url: 'https://user:secret@ocw.mit.edu/courses/a/' }, { title: '' }]) {
    assert.equal(normalizeMitCourse({ ...raw(), ...patch }), null);
  }
});

test('fetches every page, sends exact topic filter, and deduplicates courses', async () => {
  const urls = [];
  const result = await fetchMitCourses(async (url) => {
    urls.push(url);
    if (urls.length === 1) return page([raw(1)], 'https://api.learn.mit.edu/api/v1/courses/?platform=ocw&offset=100');
    return page([raw(1), raw(2), { ...raw(3), platform: { code: 'mitx' } }]);
  });
  assert.equal(urls.length, 2);
  assert.equal(new URL(urls[0]).searchParams.get('topic'), 'Energy, Climate & Sustainability');
  assert.deepEqual(result.map((course) => course.id), ['mit-ocw-1', 'mit-ocw-2']);
});

test('rejects malformed or failed upstream responses and untrusted pagination', async () => {
  for (const fetcher of [async () => new Response('', { status: 503 }), async () => new Response('not json'), async () => page([raw()], 'https://evil.example/api/v1/courses/?platform=ocw'), async () => page([{ broken: true }]), async () => page([raw()], 'https://api.learn.mit.edu/api/v1/courses/?platform=ocw')]) {
    await assert.rejects(fetchMitCourses(fetcher));
  }
  assert.deepEqual(await fetchMitCourses(async () => page([])), []);
});

test('shares catalogue fetches but randomly selects per request and can exclude current course', async () => {
  let calls = 0;
  let chosen = 0;
  const source = createMitCourseSource({ fetcher: async () => { calls++; return page([raw(1), raw(2)]); }, choose: (max) => chosen++ % max });
  const results = await Promise.all([source.getForYou(), source.getForYou()]);
  assert.equal(calls, 1);
  assert.notEqual(results[0].course.id, results[1].course.id);
  assert.equal(results[0].selection, 'random');
  assert.equal(results[0].catalog.courseCount, 2);
  assert.equal((await source.getForYou('mit-ocw-1')).course.id, 'mit-ocw-2');
  const single = createMitCourseSource({ fetcher: async () => page([raw(1)]) });
  assert.equal((await single.getForYou('mit-ocw-1')).course.id, 'mit-ocw-1');
  assert.equal(await createMitCourseSource({ fetcher: async () => page([]) }).getForYou(), null);
});

test('refreshes catalogue, uses bounded stale data on failure, and backs off retries', async () => {
  let time = 1;
  let calls = 0;
  let fail = false;
  const source = createMitCourseSource({ now: () => time, fetcher: async () => { calls++; if (fail) throw new Error('offline'); return page([raw(1)]); } });
  await source.getForYou();
  time += 6 * 3600_000;
  fail = true;
  assert.equal((await source.getForYou()).catalog.stale, true);
  await source.getForYou();
  assert.equal(calls, 2);
  time += 30_001;
  fail = false;
  assert.equal((await source.getForYou()).catalog.stale, false);
  assert.equal(calls, 3);
  time += 24 * 3600_000;
  fail = true;
  await assert.rejects(source.getForYou());
});

test('public API returns one course, handles CORS, empty results, errors, and methods', async () => {
  let empty = false;
  let fail = false;
  let exclude;
  const source = { async getForYou(value) { exclude = value; if (fail) throw new Error('upstream internal details'); return empty ? null : { course: normalizeMitCourse(raw()), selection: 'random' }; } };
  const server = createApiServer({}, ['http://localhost:3000'], source);
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}/api/courses/for-you`;
    const response = await fetch(`${url}?exclude=mit-ocw-2`, { headers: { Origin: 'http://localhost:3000' } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'http://localhost:3000');
    assert.equal((await response.json()).recommendation.course.source.providerId, 'mit-ocw');
    assert.equal(exclude, 'mit-ocw-2');
    assert.equal((await fetch(url, { method: 'OPTIONS', headers: { Origin: 'http://localhost:3000' } })).status, 204);
    assert.equal((await fetch(url, { method: 'PUT' })).status, 405);
    assert.equal((await fetch(url, { headers: { Origin: 'https://untrusted.example' } })).status, 403);
    empty = true;
    assert.deepEqual(await (await fetch(url)).json(), { recommendation: null });
    fail = true;
    const unavailable = await fetch(url);
    assert.equal(unavailable.status, 503);
    assert.equal(JSON.stringify(await unavailable.json()).includes('internal details'), false);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});

test('course response uses request-specific learner data without changing the catalogue cache', async () => {
  const supply = { ...raw(10), title: 'Green Supply Chain Management' };
  const business = { ...raw(11), title: 'S-Lab: Laboratory for Sustainable Business' };
  let fetches = 0;
  const source = createMitCourseSource({ fetcher: async () => { fetches++; return page([raw(1), supply, business]); }, choose: () => 0 });
  const learner = { name: 'Maya Example', role: 'Procurement Lead', organization: 'Example Works', companyGoal: 'Use recycled materials', goals: 'Learn supplier assessment', interests: ['Circularity'], knowledge: 'Supplier relationship experience' };
  const first = await source.getForYou(undefined, learner);
  assert.equal(first.course.id, 'mit-ocw-10');
  assert.equal(first.selection, 'presentation');
  assert.equal(first.catalog.courseCount, 2);
  assert.equal(first.gains.items.length, 3);
  assert.equal(first.gains.mode, 'mock-ai');
  assert.match(first.gains.items[0].title, /suppliers/);
  assert.deepEqual(first.learner, learner);
  assert.match(first.rationale.reasons[0].description, /purchase|materials/);
  assert.match(first.rationale.reasons[1].description, /materials|waste/);
  assert.match(first.rationale.reasons[2].description, /supply-chain/);
  const visibleCopy = JSON.stringify({ rationale: first.rationale, action: first.workplaceAction });
  for (const field of [learner.name, learner.role, learner.organization, learner.companyGoal, learner.goals, learner.knowledge, ...learner.interests]) {
    assert.ok(!visibleCopy.includes(field), `Do not repeat profile field: ${field}`);
  }
  assert.ok(first.workplaceAction.question.includes('materials we buy'));
  const secondLearner = { ...learner, name: 'Robin Example', role: 'Software Engineer', companyGoal: '', goals: 'Learn energy efficiency' };
  const next = await source.getForYou(first.course.id, secondLearner);
  assert.equal(next.course.id, 'mit-ocw-11');
  assert.equal(next.gains.items.length, 3);
  assert.notDeepEqual(next.gains.items, first.gains.items);
  assert.deepEqual(next.learner, secondLearner);
  assert.match(next.rationale.reasons[0].description, /technical decision/);
  assert.match(next.rationale.reasons[1].description, /cleaner energy/);
  assert.notDeepEqual(next.rationale.reasons, first.rationale.reasons);
  assert.ok(!JSON.stringify(next.rationale).includes(secondLearner.goals));
  assert.ok(!JSON.stringify(next).includes('Maya'));
  assert.ok(!next.workplaceAction.question.includes('materials we buy'));
  const anonymous = await source.getForYou();
  assert.equal(anonymous.learner, null);
  assert.ok(!JSON.stringify(anonymous).includes('Maya'));
  assert.equal(fetches, 1);
  const minimal = await source.getForYou(undefined, { ...learner, role: '', organization: '', companyGoal: '', goals: '', interests: [], knowledge: '' });
  assert.ok(!JSON.stringify(minimal).includes('Northline'));
  assert.ok(!JSON.stringify(minimal).includes('30%'));
  const interestsOnly = await source.getForYou(undefined, { ...learner, goals: '', companyGoal: '', role: '', knowledge: '', interests: ['Solar power'] });
  assert.match(interestsOnly.rationale.reasons[1].description, /cleaner energy/);
  assert.ok(!JSON.stringify(interestsOnly.rationale).includes('Solar power'));
});
