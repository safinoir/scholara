import type { Metadata } from "next";
import { QuizFlow } from "@/components/quiz/QuizFlow";

export const metadata: Metadata = {
  title: "The quiz — Scholara",
  description:
    "Fourteen questions about how you actually work. Takes about two minutes.",
};

export default function QuizPage() {
  return <QuizFlow />;
}
