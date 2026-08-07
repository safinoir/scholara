import type { Metadata } from "next";
import { PlanView } from "@/components/plan/PlanView";

export const metadata: Metadata = {
  title: "Your week — Scholara",
};

export default function PlanPage() {
  return <PlanView />;
}
