import type { Metadata } from "next";
import { requirePartnerAdmin } from "../../partner-admin-auth";
import { AnalyticsDashboard } from "./analytics-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Statistik – Elektrikerakut.nu",
  robots: { index: false, follow: false },
};

export default async function AnalyticsPage() {
  await requirePartnerAdmin();
  return <AnalyticsDashboard />;
}
