import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { servicePhotos } from "../site-photos";

export const metadata: Metadata = {
  title: "Integritetspolicy | Elektrikerakut.nu",
  description: "Information om hur Elektrikerakut.nu hanterar uppgifter från kund- och partnerförfrågningar.",
  alternates: { canonical: "https://elektrikerakut.nu/integritetspolicy" },
};

export default function PrivacyPage() {
  return <main className="legal-page"><Link href="/">← Till startsidan</Link><h1>Integritetspolicy</h1><figure className="legal-photo"><Image src={servicePhotos[6]} alt="Elektriker vid servicebil utanför en bostad" width={1448} height={1086} sizes="(max-width: 700px) calc(100vw - 28px), 760px" priority /></figure><p>Elektrikerakut.nu använder uppgifter från inskickade förfrågningar för att hantera ärendet och kontakta dig om matchning med ett elföretag.</p><h2>Vilka uppgifter behandlas?</h2><p>Det kan vara valt elproblem, eventuell beskrivning, postnummer och telefonnummer. Uppgifterna sparas i vårt ärendehanteringssystem så att vi kan följa upp förfrågan.</p><h2>Varför behandlas uppgifterna?</h2><p>Uppgifterna används för att bedöma täckning, matcha rätt partner och ringa upp dig. De lämnas endast vidare till aktuell partner när det behövs för att hantera din förfrågan.</p><h2>Dina rättigheter</h2><p>Du kan begära information om, rättelse av eller radering av dina uppgifter genom att kontakta oss via den kontaktväg som anges på sajten.</p><p><strong>Senast uppdaterad: 10 augusti 2026.</strong></p></main>;
}
