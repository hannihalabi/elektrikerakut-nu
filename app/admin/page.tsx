import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole, Zap } from "lucide-react";
import { requireChatGPTUser } from "../chatgpt-auth";
import { isPartnerAdmin } from "../partner-admin-auth";
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
  const user = await requireChatGPTUser("/admin");
  if (!await isPartnerAdmin(user)) {
    return (
      <main className="admin-denied">
        <span className="brand-mark"><Zap size={20} /></span>
        <LockKeyhole size={35} />
        <h1>Åtkomst nekad</h1>
        <p>{user.email} är inloggad men finns inte i administratörslistan.</p>
        <Link href="/">Till startsidan</Link>
      </main>
    );
  }
  return <PartnersAdmin displayName={user.displayName} />;
}
