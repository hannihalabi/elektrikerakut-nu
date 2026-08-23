"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowDownUp, ArrowRight, BatteryCharging, BookOpen, CircleOff, Clock3, Home, Lightbulb, PlugZap, Search, ShieldAlert, TriangleAlert, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import type { GuidePost } from "./posts";
import { servicePhotos } from "../site-photos";

type Topic = {
  id: string;
  label: string;
  categories: string[];
};

const topics: Topic[] = [
  { id: "akut", label: "Akut & säkerhet", categories: ["Akut elsäkerhet", "Eljour", "Elolycka", "Strömavbrott", "Säkringar", "Jordfelsbrytare"] },
  { id: "hemma", label: "Hem & installation", categories: ["Elcentral", "Eluttag", "Elinstallation", "Elinstallationsregler", "Elprodukter", "Jordning", "Badrum", "Kök", "Äldre hus", "Renovering", "Smarta hem", "Uppvärmning", "Värmepump"] },
  { id: "laddning", label: "Laddning & produkter", categories: ["Elbilsladdning", "Laddning", "Batterier", "Laddare", "Köpa elprodukter", "IP-klass"] },
  { id: "vardag", label: "Belysning & vardag", categories: ["Belysning", "Sladdar", "Vitvaror", "Utomhus", "Fritidshus", "Åska", "Solceller", "Elsäkerhet hemma"] },
];

const quickPaths = [
  { slug: "stromavbrott-hemma", title: "Strömmen har gått", description: "Börja här om hela eller delar av hemmet är strömlöst.", Icon: CircleOff, tone: "blue" },
  { slug: "jordfelsbrytaren-loser-ut", title: "Säkringen löser ut", description: "En säker ordning för säkring eller jordfelsbrytare.", Icon: Zap, tone: "green" },
  { slug: "luktar-brant-fran-elcentralen", title: "Det luktar bränt", description: "Värme, rök eller bränd lukt ska tas på allvar.", Icon: TriangleAlert, tone: "red" },
  { slug: "eluttag-fungerar-inte", title: "Uttag eller lampa fungerar inte", description: "Avgränsa problemet utan att öppna något.", Icon: PlugZap, tone: "amber" },
];

function matches(post: GuidePost, query: string) {
  const haystack = `${post.title} ${post.description} ${post.category}`.toLocaleLowerCase("sv-SE");
  return haystack.includes(query.toLocaleLowerCase("sv-SE").trim());
}

type SortOrder = "senaste" | "aldsta" | "az";

const sortOptions: { id: SortOrder; label: string }[] = [
  { id: "senaste", label: "Senaste först" },
  { id: "aldsta", label: "Äldsta först" },
  { id: "az", label: "Titel A–Ö" },
];

function sortPosts(posts: GuidePost[], order: SortOrder) {
  const sorted = [...posts];
  if (order === "az") return sorted.sort((left, right) => left.title.localeCompare(right.title, "sv-SE"));
  sorted.sort((left, right) => new Date(left.publishedAt).getTime() - new Date(right.publishedAt).getTime());
  return order === "senaste" ? sorted.reverse() : sorted;
}

export function GuideLibrary({ posts }: { posts: GuidePost[] }) {
  const [activeTopic, setActiveTopic] = useState("alla");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("senaste");

  const visiblePosts = useMemo(() => {
    const topic = topics.find((item) => item.id === activeTopic);
    const filtered = posts.filter((post) => (!topic || topic.categories.includes(post.category)) && (!query.trim() || matches(post, query)));
    return sortPosts(filtered, sortOrder);
  }, [activeTopic, posts, query, sortOrder]);

  const featuredPosts = useMemo(() => sortPosts(posts, sortOrder).slice(0, 6), [posts, sortOrder]);
  const isFiltered = activeTopic !== "alla" || Boolean(query.trim());
  const displayedPosts = isFiltered || showAll ? visiblePosts : featuredPosts;

  function chooseTopic(id: string) {
    setActiveTopic(id);
    setShowAll(true);
    window.requestAnimationFrame(() => document.getElementById("guide-results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return <>
    <section className="guide-quick" aria-labelledby="guide-quick-title">
      <div className="guide-section-heading"><span><ShieldAlert size={17} /> Börja med situationen</span><h2 id="guide-quick-title">Vad behöver du hjälp med?</h2><p>Välj det som stämmer bäst, så kommer du direkt till en trygg guide med nästa steg.</p></div>
      <div className="guide-quick-grid">
        {quickPaths.map(({ slug, title, description, Icon, tone }, index) => <Link className={`guide-quick-card ${tone}`} href={`/guider/${slug}`} key={slug}>
          <Image className="guide-quick-image" src={servicePhotos[index + 1]} alt="" width={1448} height={1086} sizes="(max-width: 700px) calc((100vw - 70px) / 2), 250px" />
          <span><Icon size={21} /></span><strong>{title}</strong><p>{description}</p><small>Läs guide <ArrowRight size={15} /></small>
        </Link>)}
      </div>
    </section>

    <section className="guide-browser" aria-labelledby="guide-browser-title">
      <div className="guide-browser-copy"><span><BookOpen size={17} /> Utforska alla guider</span><h2 id="guide-browser-title">Sök eller välj ett ämne</h2><p>{posts.length} guider om elfel, elsäkerhet och vardagliga frågor i hemmet.</p></div>
      <div className="guide-search-row">
        <label className="guide-search"><Search size={18} /><span className="sr-only">Sök bland guider</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setShowAll(true); }} placeholder="Sök, till exempel jordfelsbrytare eller laddare" /></label>
        <label className="guide-sort"><ArrowDownUp size={16} /><span className="sr-only">Sortera guider</span><select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}>{sortOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
      </div>
      <div className="guide-topic-list" aria-label="Ämnesfilter">
        <button className={activeTopic === "alla" ? "active" : ""} type="button" onClick={() => chooseTopic("alla")}>Alla guider <small>{posts.length}</small></button>
        {topics.map((topic) => <button className={activeTopic === topic.id ? "active" : ""} type="button" key={topic.id} onClick={() => chooseTopic(topic.id)}>{topic.label} <small>{posts.filter((post) => topic.categories.includes(post.category)).length}</small></button>)}
      </div>
    </section>

    <section className="guide-results" id="guide-results" aria-labelledby="guide-results-title">
      <div className="guide-results-heading"><div><span>{isFiltered ? "Resultat" : "Utvalt för dig"}</span><h2 id="guide-results-title">{isFiltered ? `${visiblePosts.length} guider som matchar din sökning` : "Vanliga frågor just nu"}</h2></div>{!isFiltered && !showAll && <button type="button" onClick={() => setShowAll(true)}>Visa alla {posts.length} guider <ArrowRight size={16} /></button>}</div>
      {displayedPosts.length > 0 ? <div className="guide-list" aria-live="polite">
        {displayedPosts.map((post) => <article key={post.slug} className={`guide-card ${post.accent}`}>
          <div className="guide-card-meta"><span>{post.category}</span><small><Clock3 size={14} /> {post.readTime}</small></div>
          <h3>{post.title}</h3><p>{post.description}</p>
          <Link href={`/guider/${post.slug}`}>Läs guiden <ArrowRight size={16} /></Link>
        </article>)}
      </div> : <div className="guide-empty"><Search size={21} /><strong>Inga guider matchar sökningen</strong><p>Prova ett kortare sökord eller välj ett ämne ovan.</p><button type="button" onClick={() => { setQuery(""); setActiveTopic("alla"); }}>Återställ sökning</button></div>}
      {!isFiltered && showAll && <p className="guide-result-count">Visar samtliga {posts.length} guider.</p>}
    </section>

    <section className="guide-topic-summary" aria-label="Populära ämnen">
      <Home size={20} /><div><strong>Vill du bara förebygga problem?</strong><p>Utforska tips om belysning, sladdar, produkter och laddning i din egen takt.</p></div><button type="button" onClick={() => chooseTopic("vardag")}>Vardagstips <Lightbulb size={15} /></button><button type="button" onClick={() => chooseTopic("laddning")}>Laddning <BatteryCharging size={15} /></button>
    </section>
  </>;
}
