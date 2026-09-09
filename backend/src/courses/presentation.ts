import type { LearnerContext, StudyCourse, WorkplaceAction } from "./types.js";
import { inferLearningFocus } from "./learning-context.js";

export const supplierReviewAction: WorkplaceAction = {
  title: "Bring one better question to your next supplier review.",
  duration: "10 minutes",
  instruction: "Choose one material supplier. Look through their latest sustainability information, then add this question to your review agenda.",
  question: "Which of the materials we buy from you has the biggest emissions footprint, and what lower-emission alternative could we explore together?",
  outcome: "One supplier, one question, one opportunity to discuss.",
};

export function workplaceActionFor(learner: LearnerContext | null): WorkplaceAction {
  if (learner && /procurement|purchasing|sourcing|supply chain/i.test(learner.role)) return supplierReviewAction;
  return {
    title: "Bring one sustainability question to your next team conversation.",
    duration: "10 minutes",
    instruction: "Choose one decision or process in your work. Note an idea from the course that could help you look at it differently, then prepare a question for your team.",
    question: inferLearningFocus(learner).question,
    outcome: "One idea, one question, one conversation to start.",
  };
}

/** Keep a coherent opening story while retaining live MIT content and alternatives. */
export function presentationCoursePool(courses: StudyCourse[]): StudyCourse[] {
  const related = courses.filter((course) => /green supply chain management|laboratory for sustainable business|introduction to sustainable energy|energy economics/i.test(course.title));
  return related.length ? related : courses;
}

export function openingPresentationCourse(courses: StudyCourse[]) {
  return courses.find((course) => /green supply chain management/i.test(course.title));
}
