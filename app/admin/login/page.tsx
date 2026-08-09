import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPartnerAdmin } from "../../partner-admin-auth";
import { AdminLogin } from "./admin-login";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Logga in – Elektrikerakut.nu",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await getPartnerAdmin()) redirect("/admin");
  return <AdminLogin />;
}
