"use client";

import { ArrowLeft, ArrowUpRight, BarChart3, BookOpen, ChevronLeft, ChevronRight, FileText, Network, PhoneCall, Search, ShieldCheck, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { guidePosts } from "../../guider/posts";

export function SerpsAdmin() {
  const [query, setQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const posts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return guidePosts.filter((post) => `${post.title} ${post.description} ${post.category}`.toLowerCase().includes(normalized));
  }, [query]);
  const categories = new Set(guidePosts.map((post) => post.category)).size;

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("admin-sidebar-collapsed", String(next));
      return next;
    });
  }

  return <main className={`admin-shell${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
    <aside className="admin-sidebar">
      <button className="admin-sidebar-toggle" type="button" onClick={toggleSidebar} aria-label={sidebarCollapsed ? "Expandera sidomeny" : "Minimera sidomeny"} title={sidebarCollapsed ? "Expandera meny" : "Minimera meny"}>{sidebarCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}</button>
      <Link className="brand admin-brand" href="/"><span className="brand-mark"><BookOpen size={18} /></span><span>Elektrikerakut<span>.nu</span></span></Link>
      <nav aria-label="Adminnavigering">
        <Link href="/admin"><Users size={18} /> Partners</Link>
        <Link href="/admin/call-center"><PhoneCall size={18} /> Call center</Link>
        <Link href="/admin/statistik"><BarChart3 size={18} /> Statistik</Link>
        <Link href="/admin/seo"><Network size={18} /> URL-karta</Link>
        <Link className="active" href="/admin/serps"><FileText size={18} /> SERPS</Link>
        <Link href="/"><ArrowLeft size={18} /> Kundsidan</Link>
      </nav>
    </aside>
    <section className="admin-content serps-content">
      <header className="admin-topbar"><div><p>Innehåll &amp; synlighet</p><h1>SERPS</h1></div><Link className="seo-public-link" href="/guider" target="_blank">Öppna bloggen <ArrowUpRight size={15} /></Link></header>
      <p className="serps-lead">Bloggbiblioteket för frågor som människor söker efter när de har problem med elen. Varje inlägg är en publik guide med säkerhetsråd och källa.</p>
      <div className="serps-summary"><article><span><FileText size={20} /></span><small>Publicerade inlägg</small><strong>{guidePosts.length}</strong></article><article><span className="green"><BookOpen size={20} /></span><small>Ämnesområden</small><strong>{categories}</strong></article><article><span className="blue"><ShieldCheck size={20} /></span><small>Verifierade källor</small><strong>{guidePosts.length}</strong></article></div>
      <label className="serps-search"><Search size={18} /><input aria-label="Sök blogginlägg" placeholder="Sök titel, ämne eller innehåll" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="serps-post-list">{posts.map((post) => <article key={post.slug}><div className={`serps-post-icon ${post.accent}`}><Zap size={19} /></div><div><div className="serps-post-meta"><span>{post.category}</span><small>{post.readTime}</small></div><h2>{post.title}</h2><p>{post.description}</p><a href={post.sourceUrl} target="_blank" rel="noreferrer">Källa: {post.sourceLabel} <ArrowUpRight size={13} /></a></div><Link href={`/guider/${post.slug}`} target="_blank" aria-label={`Öppna ${post.title}`}><ArrowUpRight size={18} /></Link></article>)}{posts.length === 0 && <div className="admin-empty"><Search size={24} /> Inga inlägg matchar sökningen.</div>}</div>
    </section>
  </main>;
}
