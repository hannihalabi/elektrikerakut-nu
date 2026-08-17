import type { Metadata } from "next";
import { PasswordReset } from "./password-reset";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Återställ lösenord | Elektrikerakut.nu",
  robots: { index: false, follow: false },
};

export default function PasswordResetPage() {
  return <PasswordReset />;
}
