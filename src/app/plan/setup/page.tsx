import type { Metadata } from "next";
import { PlanSetupView } from "@/components/plan/PlanSetupView";

export const metadata: Metadata = {
  title: "Weekly setup — Scholara",
};

export default function PlanSetupPage() {
  return <PlanSetupView />;
}
