import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock3, MapPin, PhoneCall, ShieldCheck, Zap } from "lucide-react";
import { areaCoordinates } from "../area-coordinates";
import { areaSlugs, getLocalAreaContent, getServiceArea, serviceAreas } from "../areas";
import LocalMatchForm from "../local-match-form";
import { servicePhotoFor } from "../../site-photos";

export const dynamicParams = false;

export function generateStaticParams() {
  return areaSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const area = getServiceArea(slug);
  if (!area) return { title: "Sidan hittades inte | Elektrikerakut.nu", robots: { index: false, follow: false } };
  const nearby = getNearestAreas(area, 3);
  const content = getLocalAreaContent(area, nearby.map((candidate) => candidate.name));
  return {
    title: `${content.title} | Elektrikerakut.nu`,
    description: content.description,
    alternates: { canonical: `https://elektrikerakut.nu/eljour/${area.slug}` },
    openGraph: { title: content.title, description: content.description, url: `https://elektrikerakut.nu/eljour/${area.slug}` },
  };
}

function getDistanceSquared(fromSlug: string, toSlug: string) {
  const from = areaCoordinates[fromSlug];
  const to = areaCoordinates[toSlug];
  if (!from || !to) return Number.POSITIVE_INFINITY;
  const latitudeScale = Math.cos((from[0] * Math.PI) / 180);
  return ((from[0] - to[0]) ** 2) + (((from[1] - to[1]) * latitudeScale) ** 2);
}

function getNearestAreas(area: NonNullable<ReturnType<typeof getServiceArea>>, limit: number) {
  return serviceAreas
    .filter((candidate) => candidate.slug !== area.slug)
    .sort((a, b) => getDistanceSquared(area.slug, a.slug) - getDistanceSquared(area.slug, b.slug))
    .slice(0, limit);
}

export default async function LocalServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const area = getServiceArea(slug);
  if (!area) notFound();
  const nearby = getNearestAreas(area, 6);
  const content = getLocalAreaContent(area, nearby.slice(0, 3).map((candidate) => candidate.name));
  const coordinates = areaCoordinates[area.slug];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Eljour i ${area.name}`,
    serviceType: "Akut elektriker",
    areaServed: {
      "@type": "AdministrativeArea",
      name: area.name,
      geo: coordinates ? { "@type": "GeoCoordinates", latitude: coordinates[0], longitude: coordinates[1] } : undefined,
    },
    provider: { "@type": "Organization", name: "Elektrikerakut.nu", url: "https://elektrikerakut.nu" },
    url: `https://elektrikerakut.nu/eljour/${area.slug}`,
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Elektrikerakut.nu", item: "https://elektrikerakut.nu" },
      { "@type": "ListItem", position: 2, name: "Eljour", item: "https://elektrikerakut.nu/eljour" },
      { "@type": "ListItem", position: 3, name: `Eljour ${area.name}`, item: `https://elektrikerakut.nu/eljour/${area.slug}` },
    ],
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [{
      "@type": "Question",
      name: content.faqQuestion,
      acceptedAnswer: { "@type": "Answer", text: content.faqAnswer },
    }],
  };
  return (
    <main className="local-seo-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <nav className="local-seo-nav"><Link className="brand" href="/"><span className="brand-mark"><Zap size={18} /></span><span>Elektrikerakut<span>.nu</span></span></Link><a className="local-nav-cta" href="#matchning">Hitta elektriker nu <ArrowRight size={16} /></a></nav>
      <section className="local-seo-hero">
        <div className="local-seo-kicker"><span /> Jour dygnet runt i {area.name}</div>
        <h1>Eljour i {area.name}</h1>
        <p className="local-seo-lead">Akut elproblem i {area.name}? Beskriv vad som hänt, så kontrollerar vi om en registrerad partner kan ta emot en förfrågan i {area.municipality}.</p>
        <a className="local-seo-primary" href="#matchning">Beskriv ditt elproblem <ArrowRight size={19} /></a>
        <div className="local-seo-trust"><span><ShieldCheck size={17} /> Registerkontrollerade företag</span><span><Clock3 size={17} /> Svar inom 2 minuter</span><span><MapPin size={17} /> {area.name} och närområde</span></div>
        <figure className="local-hero-photo"><Image src={servicePhotoFor(area.slug)} alt="Elektriker i arbetskläder vid servicebil utanför en bostad" width={1448} height={1086} sizes="(max-width: 700px) calc(100vw - 76px), 820px" priority /></figure>
      </section>
      <div className="local-seo-form-note"><MapPin size={17} /><p>{content.formIntro}</p></div>
      <LocalMatchForm areaName={area.name} postcodePrefix={area.postcodePrefix} />
      <section className="local-seo-content"><div><p className="local-seo-eyebrow">Om den här lokala sidan</p><h2>{content.coverageHeading}</h2><p>{content.coverageText}</p><p>Förfrågan är kostnadsfri. Det elföretag som eventuellt tar uppdraget avtalas och fakturerar arbetet direkt med dig.</p><Link className="text-link" href="/#matchning">Starta en matchning <ArrowRight size={16} /></Link></div><aside><PhoneCall size={21} /><strong>Behöver du hjälp nu?</strong><span>Vi står redo att ta emot din förfrågan dygnet runt.</span></aside></section>
      <section className="local-seo-request"><p className="local-seo-eyebrow">Innan du skickar</p><h2>{content.requestHeading}</h2><p>{content.requestText}</p></section>
      <section className="local-seo-faq"><p className="local-seo-eyebrow">Lokal fråga</p><h2>{content.faqQuestion}</h2><p>{content.faqAnswer}</p></section>
      {nearby.length > 0 && <section className="local-seo-nearby"><p className="local-seo-eyebrow">Närliggande täckningsområden</p><p className="local-seo-nearby-intro">Välj en sida som motsvarar platsen där elfelet finns. Dessa områden ligger närmast {area.name} utifrån respektive områdes geografiska punkt.</p><div>{nearby.map((candidate) => <Link href={`/eljour/${candidate.slug}`} key={candidate.slug}>Eljour {candidate.name}<ArrowRight size={15} /></Link>)}</div></section>}
      <footer className="local-seo-footer"><Link href="/">Elektrikerakut.nu</Link><span><Link href="/eljour">Alla områden</Link> · <Link href="/trygghet">Trygg matchning</Link></span></footer>
    </main>
  );
}
