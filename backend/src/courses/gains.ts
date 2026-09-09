import type { CourseGains, StudyCourse } from "./types.js";

/** Presentation takeaways, separate from provider metadata for future course-based generation. */
export function createMockCourseGains(course: StudyCourse): CourseGains {
  if (/supply chain/i.test(course.title)) return {
    mode: "mock-ai",
    items: [
      { title: "Compare suppliers with confidence", description: "Bring environmental impact into your next purchasing decision." },
      { title: "Spot hidden carbon impacts", description: "Look beyond delivery to materials, production, and end of life." },
      { title: "Find opportunities to cut waste", description: "Recognize where reuse and recovery could add value." },
    ],
  };
  if (/energy economics/i.test(course.title)) return {
    mode: "mock-ai",
    items: [
      { title: "Make sense of energy prices", description: "Connect market changes to the choices in front of you." },
      { title: "Weigh cost against climate impact", description: "Ask better questions when comparing energy investments." },
      { title: "Explain the business case", description: "Bring a clearer perspective to conversations about cleaner energy." },
    ],
  };
  if (/energy|renewab/i.test(course.title)) return {
    mode: "mock-ai",
    items: [
      { title: "Understand your energy options", description: "Get a clearer picture of how different energy sources work." },
      { title: "Compare the real trade-offs", description: "Consider emissions, reliability, and resource use together." },
      { title: "Ask better transition questions", description: "Join cleaner-energy discussions with more confidence." },
    ],
  };
  if (/business/i.test(course.title)) return {
    mode: "mock-ai",
    items: [
      { title: "See where change creates value", description: "Connect environmental improvements to everyday business decisions." },
      { title: "Turn ambition into an idea", description: "Shape a small sustainability initiative you could bring to your team." },
      { title: "Build a more persuasive case", description: "Explain the benefits and trade-offs behind your proposal." },
    ],
  };
  return {
    mode: "mock-ai",
    items: [
      { title: "Make sense of sustainability", description: "Build vocabulary for clearer conversations about environmental impact." },
      { title: "Look at choices differently", description: "Bring a sustainability perspective to a decision you already make." },
      { title: "Find a practical first step", description: "Leave with one idea worth exploring in your everyday work." },
    ],
  };
}
