import { workplaceActionFor, presentationCoursePool, openingPresentationCourse } from "./presentation.js";
import { createMockRationale } from "./rationale.js";
import { createMockCourseGains } from "./gains.js";
import { randomInt } from "node:crypto";
import type { CourseRecommendation, LearnerContext, StudyCourse } from "./types.js";

const API = "https://api.learn.mit.edu/api/v1/courses/";
// MIT treats each topic parameter as an exact topic name, including commas.
// Child names below also validate normalized records.
const TOPICS = ["Adaptation and Resilience", "Built Environment", "Climate and Energy Policy", "Climate Science", "Ecosystems", "Energy", "Environmental and Climate Justice", "Natural Systems", "Sustainable Business"];
const TTL = 6 * 60 * 60 * 1000;
const MAX_STALE = 24 * 60 * 60 * 1000;
type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue => value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const text = (value: unknown): string => typeof value === "string" ? value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() : "";
const names = (value: unknown): string[] => list(value).map((item) => text(record(item).name)).filter(Boolean);
const positive = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;

export function normalizeMitCourse(input: unknown): StudyCourse | null {
  const item = record(input);
  const topics = names(item.topics);
  if (record(item.platform).code !== "ocw" || item.resource_type !== "course" || item.published !== true || !topics.some((topic) => topic === "Energy, Climate & Sustainability" || TOPICS.includes(topic))) return null;
  const id = typeof item.id === "number" ? String(item.id) : text(item.id);
  const title = text(item.title);
  let courseUrl: URL;
  try { courseUrl = new URL(text(item.url)); } catch { return null; }
  if (!id || !title || courseUrl.protocol !== "https:" || courseUrl.hostname !== "ocw.mit.edu" || courseUrl.port || courseUrl.username || courseUrl.password || !/^\/courses\/[^/]+\/$/.test(courseUrl.pathname)) return null;
  const runs = list(item.runs).map(record).filter((run) => run.published === true);
  const run = runs.find((value) => value.id === item.best_run_id) ?? runs[0] ?? {};
  const languages = list(run.languages ?? item.languages).map((value) => typeof value === "string" ? text(value) : text(record(value).name)).filter(Boolean);
  const term = [text(run.semester), typeof run.year === "number" ? String(run.year) : ""].filter(Boolean).join(" ");
  return {
    id: `mit-ocw-${id}`,
    source: { providerId: "mit-ocw", courseId: id, providerName: "MIT OpenCourseWare", courseUrl: courseUrl.href },
    title,
    summary: text(item.description) || text(run.description) || "Explore the course materials on MIT OpenCourseWare.",
    topics: [...new Set([...topics.filter((topic) => TOPICS.includes(topic)), ...list(item.ocw_topics).map(text).filter((topic) => /climate|renewable|sustainab/i.test(topic))])].slice(0, 5),
    level: names(run.level).join(" / ") || null,
    format: [...new Set([...names(item.delivery), ...names(item.pace)])].join(" · ") || "Open course materials",
    durationWeeks: positive(run.min_weeks ?? item.min_weeks),
    hoursPerWeek: positive(run.min_weekly_hours ?? item.min_weekly_hours),
    language: languages.join(", ") || null,
    courseNumber: list(record(item.course).course_numbers).map((value) => text(record(value).value)).filter(Boolean).join(" / ") || null,
    term: term || null,
    instructors: list(run.instructors).map((value) => text(record(value).full_name)).filter(Boolean),
    materials: list(item.course_feature).map(text).filter(Boolean),
    licenseUrl: item.license_cc === true ? "https://ocw.mit.edu/pages/privacy-and-terms-of-use/" : null,
  };
}

function safePage(value: string) {
  const url = new URL(value);
  if (url.origin !== new URL(API).origin || url.pathname !== new URL(API).pathname || url.username || url.password || url.searchParams.get("platform") !== "ocw") throw new Error("Invalid MIT pagination URL");
  return url.href;
}

export async function fetchMitCourses(fetcher: typeof fetch = fetch): Promise<StudyCourse[]> {
  const url = new URL(API);
  url.searchParams.set("platform", "ocw");
  url.searchParams.set("topic", "Energy, Climate & Sustainability");
  url.searchParams.set("limit", "100");
  let next: string | null = url.href;
  const visited = new Set<string>();
  const courses = new Map<string, StudyCourse>();
  const signal = AbortSignal.timeout(20_000);
  let received = 0;
  while (next) {
    const current = safePage(next);
    if (visited.has(current) || visited.size >= 20) throw new Error("MIT pagination limit reached");
    visited.add(current);
    const response = await fetcher(current, { signal, headers: { Accept: "application/json" }, redirect: "error" });
    if (!response.ok) throw new Error(`MIT returned ${response.status}`);
    const page = record(await response.json());
    if (!Array.isArray(page.results) || !(page.next === null || typeof page.next === "string")) throw new Error("Unexpected MIT catalogue format");
    received += page.results.length;
    for (const item of page.results) {
      const course = normalizeMitCourse(item);
      if (course) courses.set(course.id, course);
    }
    next = page.next;
  }
  if (received && !courses.size) throw new Error("MIT returned no usable course records");
  return [...courses.values()];
}

/** Cache the catalogue; select the presentation opener or an alternative per request. */
export function createMitCourseSource({ fetcher = fetch, now = Date.now, choose = randomInt }: {
  fetcher?: typeof fetch; now?: () => number; choose?: (max: number) => number;
} = {}) {
  let cache: { courses: StudyCourse[]; timestamp: number } | undefined;
  let pending: Promise<void> | undefined;
  let retryAfter = 0;
  return {
    async getForYou(exclude?: string, learner: LearnerContext | null = null): Promise<CourseRecommendation | null> {
      if (!cache || now() - cache.timestamp >= TTL) {
        if (!pending && now() >= retryAfter) {
          pending = fetchMitCourses(fetcher).then((courses) => { cache = { courses, timestamp: now() }; retryAfter = 0; })
            .catch((error: unknown) => { retryAfter = now() + 30_000; throw error; })
            .finally(() => { pending = undefined; });
        }
        try {
          if (pending) await pending;
          else if (!cache || now() - cache.timestamp >= MAX_STALE) throw new Error("MIT catalogue temporarily unavailable");
        } catch (error) {
          if (!cache || now() - cache.timestamp >= MAX_STALE) throw error;
        }
      }
      if (!cache) throw new Error("MIT catalogue unavailable");
      if (!cache.courses.length) return null;
      const pool = presentationCoursePool(cache.courses);
      const candidates = pool.length > 1 ? pool.filter((course) => course.id !== exclude) : pool;
      const opening = !exclude ? openingPresentationCourse(candidates) : undefined;
      const course = opening ?? candidates[choose(candidates.length)];
      return {
        id: `presentation-${course.id}`,
        selection: opening ? "presentation" : "random",
        course,
        rationale: createMockRationale(course, learner),
        gains: createMockCourseGains(course),
        learner,
        workplaceAction: workplaceActionFor(learner),
        catalog: { courseCount: pool.length, fetchedAt: new Date(cache.timestamp).toISOString(), stale: now() - cache.timestamp >= TTL },
      };
    },
  };
}

export const mitCourseSource = createMitCourseSource();
