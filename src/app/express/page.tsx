import type { Metadata } from "next";
import { ExpressForm } from "@/components/quiz/ExpressForm";

export const metadata: Metadata = {
  title: "Express setup — Scholara",
  description:
    "Choose a starting persona, refine Scholara's six practical axes, and name the obstacles your study plan should address.",
};

export default function ExpressPage() {
  return <ExpressForm />;
}
