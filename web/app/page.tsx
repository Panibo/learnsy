import type { Metadata } from "next";
import ForYou from "./courses/for-you";

export const metadata: Metadata = {
  title: "For you | Learnsy",
  description: "Explore a sustainability course from MIT OpenCourseWare. A new direction for your next chapter.",
};

export default function Home() {
  return <ForYou />;
}
