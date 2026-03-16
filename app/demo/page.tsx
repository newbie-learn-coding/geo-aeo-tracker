import type { Metadata } from "next";
import { SovereignDashboard } from "@/components/sovereign-dashboard";

export const metadata: Metadata = {
  title: "GEO/AEO Tracker — Demo",
  description: "Read-only demo of the GEO/AEO Tracker. Explore AI visibility tracking, competitor battlecards, citation analysis, and more.",
  alternates: { canonical: "/demo" },
};

export default function DemoPage() {
  return <SovereignDashboard demoMode />;
}
