import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash, randomBytes } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { createApiServer } from '../dist/server.js';
import { createMitCourseSource } from '../dist/courses/mit.js';
import { MAX_CV_BYTES, parseProfile } from '../dist/models/profile.js';

const input = { name: ' Alex Example ', email: 'Alex@Example.com', role: 'Designer', organization: 'Example', location: 'Helsinki', bio: 'Design and research', goals: 'Study analytics', linkedin: 'https://www.linkedin.com/in/alex-example', interests: ['Design', 'Analytics'], cv: null };

test('validates fields, LinkedIn, interests, and CV boundaries', () => {
  for (const change of [{ name: ' ' }, { email: 'bad' }, { companyGoal: 123 }, { companyGoal: 'x'.repeat(2001) }, { linkedin: 'https://example.com/in/person' }, { interests: ['$ok', {}] }, { interests: Array(51).fill('Design') }, { cv: { name: '../cv.pdf', data: 'YQ==' } }, { cv: { name: 'cv.pdf', data: 'broken' } }, { cv: { name: 'cv.exe', data: 'YQ==' } }]) {
    assert.throws(() => parseProfile({ ...input, ...change }));
  }
  assert.equal(parseProfile(input).companyGoal, '');
  assert.equal(parseProfile({ ...input, companyGoal: ' Lower emissions ' }).companyGoal, 'Lower emissions');
  const file = { name: 'cv.pdf', data: Buffer.alloc(MAX_CV_BYTES).toString('base64') };
  assert.equal(parseProfile({ ...input, cv: file }).cv.data.length(), MAX_CV_BYTES);
  assert.throws(() => parseProfile({ ...input, cv: { ...file, data: Buffer.alloc(MAX_CV_BYTES + 1).toString('base64') } }));
});

const live = process.env.DB_URL ? test : test.skip;
live('MongoDB profile API persists, isolates, updates, and removes CVs', async (t) => {
  const client = new MongoClient(process.env.DB_URL, { serverSelectionTimeoutMS: 5000 });
  const databaseName = `aisprint_profile_test_${randomBytes(8).toString('hex')}`;
  let server;
  try {
    await client.connect();
    const db = client.db(databaseName);
    const courseSource = createMitCourseSource({ fetcher: async () => new Response(JSON.stringify({ results: [{
      id: 1, title: 'Sustainability', description: 'A course', published: true, platform: { code: 'ocw' },
      resource_type: 'course', topics: [{ name: 'Energy, Climate & Sustainability' }], url: 'https://ocw.mit.edu/courses/test-sustainability/',
    }], next: null })) });
    server = createApiServer(db, ['http://localhost:3000'], courseSource);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}/api/profile`;
    const token = randomBytes(32).toString('hex');
    const otherToken = randomBytes(32).toString('hex');
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Origin: 'http://localhost:3000' };
    const put = (body) => fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
    assert.equal((await fetch(url)).status, 401);
    assert.equal((await fetch(url, { headers })).status, 404);
    assert.equal((await fetch(url, { headers: { ...headers, Origin: 'https://untrusted.example' } })).status, 403);
    const preflight = await fetch(url, { method: 'OPTIONS', headers: { Origin: 'http://localhost:3000' } });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), 'http://localhost:3000');
    assert.equal((await put({ ...input, email: 'bad' })).status, 400);
    assert.equal((await db.collection('profiles').countDocuments()), 0);
    const cv = { name: 'test-cv.pdf', data: Buffer.from('%PDF-1.4\nTest CV fixture').toString('base64') };
    assert.equal((await put({ ...input, cv })).status, 200);
    const record = await db.collection('profiles').findOne({ _id: createHash('sha256').update(token).digest('hex') });
    assert.equal(record.name, 'Alex Example');
    assert.equal(record.email, 'alex@example.com');
    assert.equal(Buffer.from(record.cv.data.value()).toString('base64'), cv.data);
    assert.equal(JSON.stringify(record).includes(token), false);
    const read = await fetch(url, { headers });
    assert.equal(read.headers.get('Cache-Control'), 'no-store');
    const saved = await read.json();
    assert.equal(saved.cv.data, cv.data);
    assert.deepEqual(saved.interests, input.interests);
    assert.equal(saved._id, undefined);
    assert.equal((await fetch(url, { headers: { Authorization: `Bearer ${otherToken}` } })).status, 404);
    // Same email cannot provide access to or overwrite another browser's profile.
    assert.equal((await fetch(url, { method: 'PUT', headers: { ...headers, Authorization: `Bearer ${otherToken}` }, body: JSON.stringify({ ...input, name: 'Another profile' }) })).status, 200);
    assert.equal((await (await fetch(url, { headers })).json()).name, 'Alex Example');
    await t.test('For you reads the current owner profile, reflects edits, and excludes private files', async () => {
      const courseUrl = url.replace('/api/profile', '/api/courses/for-you');
      const getCourse = (key) => fetch(courseUrl, { headers: key ? { Authorization: `Bearer ${key}` } : {} });
      const response = await getCourse(token);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('Cache-Control'), 'no-store');
      const first = (await response.json()).recommendation;
      assert.equal(first.learner.name, 'Alex Example');
      assert.equal(first.learner.companyGoal, '');
      assert.equal(first.learner.knowledge, input.bio);
      for (const field of ['email', 'linkedin', 'cv', '_id']) assert.equal(field in first.learner, false);
      assert.ok(!JSON.stringify(first).includes(cv.data));
      const other = (await (await getCourse(otherToken)).json()).recommendation;
      assert.equal(other.learner.name, 'Another profile');
      assert.equal((await (await getCourse()).json()).recommendation.learner, null);
      assert.equal((await (await getCourse(randomBytes(32).toString('hex'))).json()).recommendation.learner, null);
      assert.equal((await getCourse('bad-token')).status, 401);
      const edited = { ...input, name: 'Alex Updated', role: 'Engineer', companyGoal: 'Reduce office energy use', goals: 'Learn renewable energy', interests: ['Renewables'], cv };
      assert.equal((await put(edited)).status, 200);
      const refreshed = (await (await getCourse(token)).json()).recommendation;
      assert.equal(refreshed.learner.name, edited.name);
      assert.equal(refreshed.learner.role, edited.role);
      assert.equal(refreshed.learner.companyGoal, edited.companyGoal);
      assert.deepEqual(refreshed.learner.interests, edited.interests);
      assert.match(refreshed.rationale.reasons[0].description, /technical decision/);
      assert.match(refreshed.rationale.reasons[1].description, /cleaner energy/);
      assert.notDeepEqual(refreshed.rationale, first.rationale);
      assert.ok(!JSON.stringify(refreshed.rationale).includes(edited.companyGoal));
      assert.ok(!JSON.stringify(refreshed.workplaceAction).includes(edited.companyGoal));
      const reread = await (await fetch(url, { headers })).json();
      assert.equal(reread.companyGoal, edited.companyGoal);
      assert.equal(reread.cv.data, cv.data);
      const otherAgain = (await (await getCourse(otherToken)).json()).recommendation;
      assert.equal(otherAgain.learner.name, 'Another profile');
      assert.equal(otherAgain.learner.companyGoal, '');
    });
    const replacement = { name: 'updated.docx', data: Buffer.from('replacement test bytes').toString('base64') };
    assert.equal((await put({ ...input, role: 'Researcher', cv: replacement })).status, 200);
    assert.equal((await (await fetch(url, { headers })).json()).cv.data, replacement.data);
    assert.equal((await put({ ...input, cv: null })).status, 200);
    assert.equal((await (await fetch(url, { headers })).json()).cv, null);
    assert.equal(await db.collection('profiles').countDocuments(), 2);
    const updated = await db.collection('profiles').findOne({ _id: record._id });
    assert.equal(updated.createdAt.getTime(), record.createdAt.getTime());
    assert.ok(updated.updatedAt >= record.updatedAt);
    await t.test('survives API restart', async () => {
      await new Promise((resolve) => server.close(resolve));
      server = createApiServer(db, ['http://localhost:3000']);
      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api/profile`, { headers });
      assert.equal((await response.json()).name, 'Alex Example');
    });
  } finally {
    if (server?.listening) await new Promise((resolve) => server.close(resolve));
    if (client.topology?.isConnected()) await client.db(databaseName).dropDatabase();
    await client.close();
  }
});
