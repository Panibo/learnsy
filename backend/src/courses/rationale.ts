import { inferLearningFocus } from "./learning-context.js";
import type { LearnerContext, RecommendationRationale, StudyCourse } from "./types.js";

function workConnection(learner: LearnerContext) {
  const background = learner.role || learner.knowledge;
  if (/procurement|purchasing|sourcing|supplier|supply chain/i.test(background)) return {
    title: "Bring another dimension to sourcing",
    description: "The choices behind a purchase can shape its environmental impact long before it reaches you. This is a chance to bring better questions into conversations about materials, production, and cost.",
  };
  if (/engineer|software|develop|technical/i.test(background)) return {
    title: "Connect technical choices to impact",
    description: "Looking at a system through its environmental impact can reveal trade-offs that performance or cost alone might miss. Bring one technical decision into your learning as a concrete example.",
  };
  if (/design|product|research/i.test(background)) return {
    title: "Think beyond the first use",
    description: "Early design choices can influence how resources are used throughout a product’s life. Looking at the whole life cycle could add a useful dimension to your next design decision.",
  };
  return {
    title: "Make room for a different perspective",
    description: "Everyday work is a useful place to start. Revisit a familiar decision through a sustainability lens and see whether it changes the questions you ask or the options you consider.",
  };
}

function courseConnection(course: StudyCourse) {
  if (/supply chain/i.test(course.title)) return {
    title: "Follow the impact through the system",
    description: "Use the supply-chain perspective to trace a familiar product beyond your own team. Look for a point where a different choice could reduce its environmental impact.",
  };
  if (/energy/i.test(course.title)) return {
    title: "Explore the trade-offs behind energy",
    description: "Use the course’s energy perspective to compare the wider implications of a choice, then bring one question about feasibility or impact into a discussion at work.",
  };
  if (/business/i.test(course.title)) return {
    title: "Give sustainability a place in decisions",
    description: "The business perspective is a useful way to explore how environmental priorities fit into everyday planning. Choose one decision where you could make that connection more concrete.",
  };
  return {
    title: "Leave with a question worth asking",
    description: "Choose one idea from the syllabus and connect it to a situation you know. A focused question for your team is a manageable first step from learning to action.",
  };
}

/** Mock advisor copy infers a learning direction without displaying the profile. */
export function createMockRationale(course: StudyCourse, learner: LearnerContext | null = null): RecommendationRationale {
  const { title, description } = inferLearningFocus(learner);
  if (!learner) return {
    mode: "mock-ai",
    headline: "A new perspective to explore.",
    explanation: `“${course.title}” is a starting point for exploring how sustainability connects to everyday decisions. Start with one idea you would like to put into practice.`,
    reasons: [
      { title: "Explore the topic", description: `Discover course material covering ${course.topics.slice(0, 2).join(" and ").toLowerCase() || "sustainability"}.` },
      { title, description },
      courseConnection(course),
    ],
  };
  return {
    mode: "mock-ai",
    headline: "A little more understanding. A better next decision.",
    explanation: `I’d use “${course.title}” to build a bridge between understanding sustainability and acting on it. The opportunity is to bring a fresh perspective to a decision you can influence.`,
    reasons: [workConnection(learner), { title, description }, courseConnection(course)],
  };
}
