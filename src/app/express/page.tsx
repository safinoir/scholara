import type { Metadata } from "next";
import { ExpressForm } from "@/components/quiz/ExpressForm";

export const metadata: Metadata = {
  title: "Express intake — Scholara",
};

export default function ExpressPage() {
  return <ExpressForm />;
}
