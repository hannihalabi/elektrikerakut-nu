import type { Metadata } from "next";
import { PartnerApplication } from "./partner-application";

export const metadata: Metadata = {
  title: "Bli partner – Elektrikerakut.nu",
  description: "Ansök om att ta emot kvalificerade bokningar för akuta elproblem i ditt aktiva serviceområde.",
  alternates: { canonical: "https://elektrikerakut.nu/bli-partner" },
};

export default function BecomePartnerPage() {
  return <PartnerApplication />;
}
