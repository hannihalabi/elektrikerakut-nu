import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AnalyticsTracker } from "./analytics-tracker";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://elektrikerakut.nu"),
  alternates: { canonical: "/" },
  title: "Elektrikerakut.nu – snabb hjälp vid akuta elproblem",
  description: "Beskriv ditt elproblem en gång. Vi matchar din förfrågan med ett registrerat elföretag med kapacitet i Stockholmsområdet.",
  icons: {
    icon: "/favicon/elektrikerakut-favicon.svg",
    shortcut: "/favicon/elektrikerakut-favicon.svg",
  },
  openGraph: {
    title: "Akut elproblem? Vi hittar rätt hjälp.",
    description: "Snabb matchning med registrerade elföretag i Stockholm.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Elektrikerakut.nu – akut elproblem? Vi hittar rätt hjälp." }],
    locale: "sv_SE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Akut elproblem? Vi hittar rätt hjälp.",
    description: "Snabb matchning med registrerade elföretag i Stockholm.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv">
      <body>{children}<Analytics /><SpeedInsights /><AnalyticsTracker /></body>
    </html>
  );
}
