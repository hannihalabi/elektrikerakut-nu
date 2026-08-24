import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Clock3, ExternalLink, ShieldAlert, ShieldCheck, Zap } from "lucide-react";
import { getGuidePostBySlug, getGuidePosts } from "../guide-content";
import { servicePhotoFor } from "../../site-photos";
import { ChecklistResourceTools } from "../checklist-resource-tools";

type PageProps = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getGuidePostBySlug((await params).slug);
  if (!post) return {};
  const publishedTime = new Date(post.publishedAt).toISOString();
  return {
    title: `${post.title} | Elektrikerakut.nu`,
    description: post.description,
    alternates: { canonical: `/guider/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://elektrikerakut.nu/guider/${post.slug}`,
      type: "article",
      publishedTime,
    },
  };
}

export default async function GuideArticlePage({ params }: PageProps) {
  const slug = (await params).slug;
  const guidePosts = await getGuidePosts();
  const post = guidePosts.find((item) => item.slug === slug);
  if (!post) notFound();
  const related = guidePosts.filter((item) => item.slug !== post.slug).slice(0, 3);
  const publishedTime = new Date(post.publishedAt).toISOString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: publishedTime,
    dateModified: publishedTime,
    author: { "@type": "Organization", name: "Elektrikerakut.nu" },
    publisher: { "@type": "Organization", name: "Elektrikerakut.nu", url: "https://elektrikerakut.nu" },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://elektrikerakut.nu/guider/${post.slug}` },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Elektrikerakut.nu", item: "https://elektrikerakut.nu" },
      { "@type": "ListItem", position: 2, name: "Elguiden", item: "https://elektrikerakut.nu/guider" },
      { "@type": "ListItem", position: 3, name: post.title, item: `https://elektrikerakut.nu/guider/${post.slug}` },
    ],
  };
  return <main className="guide-site guide-article">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
    <header className="guide-header"><Link className="brand" href="/"><span className="brand-mark"><Zap size={18} /></span><span>Elektrikerakut<span>.nu</span></span></Link><Link className="guide-header-cta" href="/eljour">Behöver du hjälp nu? <ArrowRight size={16} /></Link></header>
    <article>
      <Link className="guide-back" href="/guider"><ArrowLeft size={16} /> Alla guider</Link>
      <header className="guide-article-heading"><span><BookOpen size={16} /> {post.category}</span><h1>{post.title}</h1><p>{post.description}</p><small><Clock3 size={14} /> {post.readTime} · {post.updatedLabel}</small></header>
      <figure className="guide-article-photo"><Image src={servicePhotoFor(post.slug)} alt="Elektriker med verktyg vid en servicebil utanför en bostad" width={1448} height={1086} sizes="(max-width: 700px) calc(100vw - 28px), 760px" priority /></figure>
      <aside className="guide-safety"><ShieldAlert size={22} /><div><strong>Viktigt om säkerhet</strong><p>{post.safetyNote}</p></div></aside>
      <div className="guide-body"><p className="guide-intro">{post.intro}</p>{post.sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.steps && <ol>{section.steps.map((step) => <li key={step}>{step}</li>)}</ol>}</section>)}</div>
      {post.slug === "checklista-elfel-hemma" && <ChecklistResourceTools />}
      <a className="guide-source" href={post.sourceUrl} target="_blank" rel="noreferrer"><ShieldCheck size={18} /><span>Fördjupa dig hos <strong>{post.sourceLabel}</strong></span><ExternalLink size={16} /></a>
      <section className="guide-cta"><div><span>Behöver du hjälp?</span><h2>Få kontakt med en elektriker</h2><p>Beskriv problemet så hjälper vi dig vidare.</p></div><Link href="/eljour">Starta förfrågan <ArrowRight size={17} /></Link></section>
      <section className="guide-related"><p>Fler guider</p><h2>Vanliga frågor om el hemma</h2><div>{related.map((item) => <Link key={item.slug} href={`/guider/${item.slug}`}><span>{item.category}</span><strong>{item.title}</strong><ArrowRight size={16} /></Link>)}</div></section>
    </article>
  </main>;
}
