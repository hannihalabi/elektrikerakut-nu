import type { Metadata } from "next";
import { requirePartnerAdmin } from "../../partner-admin-auth";
import { CallCenter } from "./call-center";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Call center – Elektrikerakut.nu",
  robots: { index: false, follow: false },
};

export default async function CallCenterPage() {
  const admin = await requirePartnerAdmin();
  return <CallCenter displayName={admin.displayName} />;
}
