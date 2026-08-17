import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ExternalLink, ShieldCheck, Zap } from "lucide-react";
import { servicePhotos } from "../site-photos";

export const metadata: Metadata = {
  title: "Trygg matchning med elföretag | Elektrikerakut.nu",
  description: "Så fungerar Elektrikerakut.nu, hur partneruppgifter granskas och vad som gäller när du anlitar ett elföretag.",
  alternates: { canonical: "https://elektrikerakut.nu/trygghet" },
};

export default function TrustPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "Trygg matchning med elföretag",
    url: "https://elektrikerakut.nu/trygghet",
    mainEntity: { "@type": "Organization", name: "Elektrikerakut.nu", url: "https://elektrikerakut.nu" },
  };

  return (
    <main className="local-seo-page trust-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="local-seo-nav">
        <Link className="brand" href="/" aria-label="Elektrikerakut.nu, startsida"><span className="brand-mark"><Zap size={18} /></span><span>Elektrikerakut<span>.nu</span></span></Link>
        <Link className="local-nav-cta" href="/#matchning">Hitta elektriker nu <ArrowRight size={16} /></Link>
      </nav>
      <section className="local-seo-hero">
        <div className="local-seo-kicker"><span /> Trygg matchning</div>
        <h1>Rätt hjälp när elen strular</h1>
        <p className="local-seo-lead">Elektrikerakut.nu är en förmedlingstjänst. Vi tar emot din förfrågan och matchar den mot aktiva partnerföretag i rätt område.</p>
        <Link className="local-seo-primary" href="/#matchning">Starta en matchning <ArrowRight size={19} /></Link>
        <figure className="local-hero-photo"><Image src={servicePhotos[3]} alt="Två elektriker med verktyg vid servicebil utanför en bostad" width={1448} height={1086} sizes="(max-width: 700px) calc(100vw - 76px), 820px" priority /></figure>
      </section>
      <section className="trust-content" aria-labelledby="trust-title">
        <p className="local-seo-eyebrow">Så arbetar vi</p>
        <h2 id="trust-title">Tydligt ansvar i varje steg</h2>
        <div className="trust-points">
          <article><CheckCircle2 size={22} /><div><h3>Partneruppgifter granskas</h3><p>Företag blir inte aktiva i nätverket förrän uppgifter, kapacitet och serviceområde har granskats.</p></div></article>
          <article><CheckCircle2 size={22} /><div><h3>Matchning efter behov</h3><p>Vi använder ditt elproblem och postnummer för att hitta en partner som har rätt område och kompetens.</p></div></article>
          <article><ShieldCheck size={22} /><div><h3>Arbetet avtalas direkt</h3><p>Partnern utför och fakturerar arbetet. Pris, omfattning och nästa steg bekräftas direkt med elföretaget.</p></div></article>
        </div>
        <div className="trust-note"><strong>Kontrollera alltid företaget</strong><span>Elsäkerhetsverket har ett offentligt register där du kan kontrollera att ett elföretag är registrerat och får utföra rätt typ av arbete.</span><a href="https://www.elsakerhetsverket.se/kollaelforetaget" target="_blank" rel="noreferrer">Kolla elföretaget hos Elsäkerhetsverket <ExternalLink size={14} /></a></div>
      </section>
      <footer className="local-seo-footer"><Link href="/">Elektrikerakut.nu</Link><span><Link href="/integritetspolicy">Integritet</Link> · <Link href="/villkor">Villkor</Link></span></footer>
    </main>
  );
}
