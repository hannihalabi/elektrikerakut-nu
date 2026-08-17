import type { Metadata } from "next";
import { requirePartnerAdmin } from "../../partner-admin-auth";
import { serviceAreas } from "../../eljour/areas";
import { guidePosts } from "../../guider/posts";
import { SeoUrlMap, type SeoUrlItem } from "./seo-url-map";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SEO och URL-karta – Elektrikerakut.nu",
  robots: { index: false, follow: false },
};

const origin = "https://elektrikerakut.nu";

const coreUrls: SeoUrlItem[] = [
  { path: "/", label: "Startsida", group: "Kärnsidor", role: "Primär konverteringssida", impact: "Hög", inSitemap: true, discoverability: "Sitemap + internlänkar", description: "Den viktigaste sidan för breda sökningar och formulärkonvertering.", priority: 1 },
  { path: "/eljour", label: "Eljour – områdeshubb", group: "Kärnsidor", role: "SEO-hubb", impact: "Hög", inSitemap: true, discoverability: "Sitemap + internlänkar", description: "Samlar och länkar vidare till alla lokala eljourssidor.", priority: 0.9 },
  { path: "/trygghet", label: "Trygg matchning", group: "Kärnsidor", role: "Förtroendesida", impact: "Medel", inSitemap: true, discoverability: "Sitemap + internlänkar", description: "Förklarar partnergranskning, ansvar och hur kunden kan kontrollera elföretag.", priority: 0.6 },
  { path: "/bli-partner", label: "Bli partner", group: "Kärnsidor", role: "B2B-konvertering", impact: "Låg", inSitemap: true, discoverability: "Sitemap + internlänkar", description: "Riktar sig till elföretag och påverkar främst partneranskaffning.", priority: 0.5 },
];

const guideUrls: SeoUrlItem[] = [
  { path: "/guider", label: "Elguiden", group: "Guider", role: "Innehållshubb", impact: "Medel", inSitemap: true, discoverability: "Sitemap + SERPS", description: "Samlad ingång till publicerade, sökorienterade elguider.", priority: 0.7 },
  ...guidePosts.map((post) => ({ path: `/guider/${post.slug}`, label: post.title, group: "Guider" as const, role: "Sökdriven guide", impact: "Medel" as const, inSitemap: true, discoverability: "Sitemap + Elguiden", description: post.description, priority: 0.6 })),
];

const legalUrls: SeoUrlItem[] = [
  { path: "/integritetspolicy", label: "Integritetspolicy", group: "Juridik", role: "Transparens och förtroende", impact: "Låg", inSitemap: false, discoverability: "Internlänk", description: "Länkad från kundformuläret men inte prioriterad för organisk trafik.", priority: null },
  { path: "/villkor", label: "Villkor", group: "Juridik", role: "Transparens och förtroende", impact: "Låg", inSitemap: false, discoverability: "Internlänk", description: "Förklarar förmedlingsrollen och vad kunden kan förvänta sig.", priority: null },
];

const technicalUrls: SeoUrlItem[] = [
  { path: "/robots.txt", label: "Robots.txt", group: "Tekniskt", role: "Crawlerstyrning", impact: "Indirekt", inSitemap: false, discoverability: "Teknisk URL", description: "Styr crawlåtkomst och pekar sökmotorer till sitemap.", priority: null, indexable: false },
  { path: "/sitemap.xml", label: "Sitemap.xml", group: "Tekniskt", role: "URL-discovery", impact: "Indirekt", inSitemap: false, discoverability: "Teknisk URL", description: "Förteckning över URL:er som sajten vill få crawlad och indexerad.", priority: null, indexable: false },
];

const localUrls: SeoUrlItem[] = serviceAreas.map((area) => ({
  path: `/eljour/${area.slug}`,
  label: `Eljour ${area.name}`,
  group: "Lokala sidor",
  municipality: area.municipality,
  role: "Lokal landningssida",
  impact: "Hög",
  inSitemap: true,
  discoverability: "Sitemap + områdeshubb",
  description: `Lokal sida för ${area.name} i ${area.municipality}.`,
  priority: 0.7,
}));

export default async function SeoPage() {
  await requirePartnerAdmin();
  return <SeoUrlMap items={[...coreUrls, ...guideUrls, ...localUrls, ...legalUrls, ...technicalUrls]} areas={serviceAreas} origin={origin} />;
}
