import { profileAccessKey } from "../profile-access";
import type { CourseRecommendation, RecommendationSource } from "./types";

const apiSource: RecommendationSource = {
  async getForYou(exclude?: string): Promise<CourseRecommendation | null> {
    const base = process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === "development" ? "http://localhost:4000" : "");
    if (!base) throw new Error("The course service is not configured. Please try again later.");
    const url = new URL(`${base.replace(/\/$/, "")}/api/courses/for-you`);
    if (exclude) url.searchParams.set("exclude", exclude);
    let response: Response;
    try {
      response = await fetch(url, { headers: { Authorization: `Bearer ${profileAccessKey()}` }, cache: "no-store", signal: AbortSignal.timeout(25_000) });
    } catch { throw new Error("Could not reach the course service. Check your connection and try again."); }
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      throw new Error(result?.error ?? "Your course could not be loaded. Please try again.");
    }
    const data = await response.json();
    if (data.recommendation === null) return null;
    const gains = data.recommendation?.gains?.items;
    if (!Array.isArray(gains) || gains.length !== 3 || !gains.every((gain) => typeof gain?.title === "string" && gain.title.trim() && typeof gain?.description === "string" && gain.description.trim())) throw new Error("The course service returned invalid takeaways. Please try again.");
    if (!data.recommendation?.course?.title || !Array.isArray(data.recommendation.rationale?.reasons) || (data.recommendation.learner !== null && !data.recommendation.learner?.name) || !data.recommendation.workplaceAction?.question || !externalCourseUrl(data.recommendation.course.source?.courseUrl)) throw new Error("The course service returned an invalid course. Please try again.");
    return data.recommendation;
  },
};

export async function getForYouRecommendation(exclude?: string, source: RecommendationSource = apiSource) {
  return source.getForYou(exclude);
}

export function externalCourseUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "ocw.mit.edu" && !url.username && !url.password && !url.port ? url.href : null;
  } catch { return null; }
}
