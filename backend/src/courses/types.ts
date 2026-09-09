/** Normalized provider data shared with the static frontend (type-only import). */
export type StudyCourse = {
  id: string;
  source: {
    providerId: string;
    courseId: string;
    providerName: string;
    courseUrl: string;
  };
  title: string;
  summary: string;
  topics: string[];
  level: string | null;
  format: string;
  durationWeeks: number | null;
  hoursPerWeek: number | null;
  language: string | null;
  courseNumber: string | null;
  term: string | null;
  instructors: string[];
  materials: string[];
  licenseUrl: string | null;
};

export type RecommendationRationale = {
  mode: "mock-ai" | "ai";
  headline: string;
  explanation: string;
  reasons: { title: string; description: string }[];
};

export type LearnerContext = {
  name: string;
  role: string;
  organization: string;
  companyGoal: string;
  goals: string;
  interests: string[];
  knowledge: string;
};

export type WorkplaceAction = {
  title: string;
  duration: string;
  instruction: string;
  question: string;
  outcome: string;
};

export type CourseGain = { title: string; description: string };

export type CourseGains = {
  mode: "mock-ai" | "ai";
  items: [CourseGain, CourseGain, CourseGain];
};

export type CourseRecommendation = {
  id: string;
  selection: "random" | "presentation" | "ai";
  course: StudyCourse;
  rationale: RecommendationRationale;
  gains: CourseGains;
  learner: LearnerContext | null;
  workplaceAction: WorkplaceAction;
  catalog: { courseCount: number; fetchedAt: string; stale: boolean };
};

export interface RecommendationSource {
  getForYou(exclude?: string, learner?: LearnerContext | null): Promise<CourseRecommendation | null>;
}
