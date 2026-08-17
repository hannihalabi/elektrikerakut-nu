import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { servicePhotos } from "../site-photos";

export const metadata: Metadata = {
  title: "Villkor för förmedlingstjänsten | Elektrikerakut.nu",
  description: "Villkor för att använda Elektrikerakut.nu som förmedlingstjänst för akuta elproblem.",
  alternates: { canonical: "https://elektrikerakut.nu/villkor" },
};

export default function TermsPage() {
  return <main className="legal-page"><Link href="/">← Till startsidan</Link><h1>Villkor</h1><figure className="legal-photo"><Image src={servicePhotos[7]} alt="Elektriker med verktyg vid servicebil utanför en bostad" width={1448} height={1086} sizes="(max-width: 700px) calc(100vw - 28px), 760px" priority /></figure><p>Elektrikerakut.nu förmedlar kontakt mellan personer med akuta elproblem och anslutna elföretag i aktiva serviceområden.</p><h2>Förmedlingstjänst</h2><p>Elektrikerakut.nu utför inte elinstallationsarbete. Det avtal som gäller för arbete, pris, garanti och betalning ingås direkt mellan kunden och det elföretag som accepterar uppdraget.</p><h2>Säkerhet</h2><p>Vid brand, rök eller omedelbar personfara ska du lämna platsen och ringa 112. Rör inte skadad elektrisk utrustning.</p><h2>Förfrågningar</h2><p>En inskickad förfrågan är inte en garanti för att en partner kan ta uppdraget. Matchning beror på område, kompetens och faktisk tillgänglighet.</p></main>;
}
