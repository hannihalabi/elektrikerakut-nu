import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, ShieldCheck, Zap } from "lucide-react";
import { serviceAreas } from "./areas";
import { servicePhotos } from "../site-photos";

export const metadata: Metadata = {
  title: "Eljour i Stockholm med omnejd | Elektrikerakut.nu",
  description: "Hitta akut elektriker och eljour i Stockholm, Solna, Nacka, Täby och fler områden i Stockholmsområdet.",
  alternates: { canonical: "https://elektrikerakut.nu/eljour" },
};

export default function ServiceAreaHub() {
  const municipalities = [...new Set(serviceAreas.map((area) => area.municipality))];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Eljour i Stockholm med omnejd",
    description: "Lokala sidor för akut elektriker och eljour i Stockholmsområdet.",
    url: "https://elektrikerakut.nu/eljour",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: serviceAreas.map((area, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `Eljour ${area.name}`,
        url: `https://elektrikerakut.nu/eljour/${area.slug}`,
      })),
    },
  };

  return (
    <main className="local-seo-page area-hub-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="local-seo-nav">
        <Link className="brand" href="/" aria-label="Elektrikerakut.nu, startsida"><span className="brand-mark"><Zap size={18} /></span><span>Elektrikerakut<span>.nu</span></span></Link>
        <Link className="local-nav-cta" href="/#matchning">Hitta elektriker nu <ArrowRight size={16} /></Link>
      </nav>

      <section className="local-seo-hero">
        <div className="local-seo-kicker"><span /> Stockholm med omnejd</div>
        <h1>Eljour där du bor</h1>
        <p className="local-seo-lead">Välj ditt område för att läsa mer om akut hjälp vid elproblem och starta en matchning med ett registrerat elföretag.</p>
        <Link className="local-seo-primary" href="/#matchning">Beskriv ditt elproblem <ArrowRight size={19} /></Link>
        <div className="local-seo-trust"><span><ShieldCheck size={17} /> Granskade partneruppgifter</span><span><MapPin size={17} /> Stockholm och närliggande kommuner</span></div>
        <figure className="local-hero-photo"><Image src={servicePhotos[2]} alt="Elektriker vid servicebil i stadsmiljö" width={1448} height={1086} sizes="(max-width: 700px) calc(100vw - 76px), 820px" priority /></figure>
      </section>

      <section className="area-hub-list" aria-labelledby="area-list-title">
        <div>
          <p className="local-seo-eyebrow">Välj område</p>
          <h2 id="area-list-title">Eljour i Stockholm och närområden</h2>
        </div>
        <div className="area-hub-grid">
          {municipalities.map((municipality) => (
            <section key={municipality} className="area-hub-group">
              <h3>{municipality}</h3>
              <div>
                {serviceAreas.filter((area) => area.municipality === municipality).map((area) => (
                  <Link href={`/eljour/${area.slug}`} key={area.slug}>Eljour {area.name}<ArrowRight size={14} /></Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <footer className="local-seo-footer"><Link href="/">Elektrikerakut.nu</Link><span><Link href="/trygghet">Så granskar vi partnerna</Link> · <Link href="/integritetspolicy">Integritet</Link></span></footer>
    </main>
  );
}
