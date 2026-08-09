import type { Metadata } from "next";
import { requirePartnerAdmin } from "../partner-admin-auth";
import { PartnersAdmin } from "./partners-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Partnerregister – Elektrikerakut.nu",
  robots: { index: false, follow: false },
};

export default function PartnersAdminPage() {
  return <AdminGate />;
}

async function AdminGate() {
  const admin = await requirePartnerAdmin();
  return <PartnersAdmin displayName={admin.displayName} />;
}
