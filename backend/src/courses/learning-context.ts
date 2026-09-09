import type { LearnerContext } from "./types.js";

const generalFocus = {
  title: "Turn understanding into action",
  description: "A useful next step is to connect sustainability concepts to one decision you can influence, then identify a small change worth trying.",
  question: "Where could we apply one idea from this course to make a more sustainable decision in our work?",
};

const focusPatterns = [
  {
    pattern: /energy|renewab|solar|wind power|electric|efficien/i,
    title: "Make more informed energy choices",
    description: "Your next step looks like understanding the trade-offs behind cleaner energy. Use that perspective to question where energy is used and which changes could make a practical difference.",
    question: "Where do we use the most energy, and what would we need to know before choosing a cleaner or more efficient alternative?",
  },
  {
    pattern: /circular|recycl|material|waste|reuse|sourc|supplier|procurement/i,
    title: "See the opportunity in materials",
    description: "There seems to be an opportunity to look beyond the initial purchase: how materials are made, used, and recovered. That can turn a routine choice into a conversation about waste and long-term value.",
    question: "Could we reduce waste by changing a material, reusing it, or asking how it will be recovered after use?",
  },
  {
    pattern: /carbon|emission|net.zero|decarbon|footprint/i,
    title: "Find where change could matter most",
    description: "A promising next step is to connect everyday decisions with their emissions impact. Start by identifying what you would need to measure before deciding where to focus your effort.",
    question: "Which part of this decision could have the greatest emissions impact, and what evidence would help us compare alternatives?",
  },
  {
    pattern: /adapt|resilien|climate risk|flood/i,
    title: "Bring a longer view to decisions",
    description: "Preparing for changing climate conditions looks like a useful direction. Consider which assumptions in a current plan might change and what would make that plan more resilient.",
    question: "Which climate-related change could challenge this plan, and what could we do now to make it more resilient?",
  },
  {
    pattern: /data|analyt|measur|report/i,
    title: "Make the evidence useful",
    description: "A useful next step appears to be translating sustainability information into a clear decision. Ask which measure would help you compare options, and where the evidence is still incomplete.",
    question: "What would we need to measure to tell whether this change is actually improving our environmental impact?",
  },
];

/** Small template-based inference for the presentation; never quote profile fields. */
export function inferLearningFocus(learner: LearnerContext | null) {
  if (!learner) return generalFocus;
  for (const hint of [learner.goals, learner.companyGoal, learner.interests.join(" "), learner.knowledge, learner.role]) {
    const focus = focusPatterns.find(({ pattern }) => pattern.test(hint));
    if (focus) return focus;
  }
  return generalFocus;
}
