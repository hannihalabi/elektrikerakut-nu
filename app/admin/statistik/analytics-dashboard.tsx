"use client";

import { ArrowLeft, BarChart3, CheckCircle2, ChevronLeft, ChevronRight, Eye, FileText, LoaderCircle, Network, PhoneCall, Radio, Users } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = { visitsDay: number; visitsWeek: number; visitsMonth: number; matchesMonth: number; foundMonth: number };

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem("admin-sidebar-collapsed") !== "true") return;
    const timer = window.setTimeout(() => setSidebarCollapsed(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("admin-sidebar-collapsed", String(next));
      return next;
    });
  }

  useEffect(() => {
    fetch("/api/admin/analytics", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as Stats & { error?: string };
        if (!response.ok) throw new Error(data.error ?? "Statistiken kunde inte hämtas.");
        setStats(data);
      })
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Statistiken kunde inte hämtas."));
  }, []);

  return (
    <main className={`admin-shell${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
      <aside className="admin-sidebar">
        <button className="admin-sidebar-toggle" type="button" onClick={toggleSidebar} aria-label={sidebarCollapsed ? "Expandera sidomeny" : "Minimera sidomeny"} title={sidebarCollapsed ? "Expandera meny" : "Minimera meny"}>{sidebarCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}</button>
        <Link className="brand admin-brand" href="/"><span className="brand-mark"><BarChart3 size={18} /></span><span>Elektrikerakut<span>.nu</span></span></Link>
        <nav aria-label="Adminnavigering">
          <Link href="/admin"><Users size={18} /> Partners</Link>
          <Link href="/admin/call-center"><PhoneCall size={18} /> Call center</Link>
          <Link className="active" href="/admin/statistik"><BarChart3 size={18} /> Statistik</Link>
          <Link href="/admin/seo"><Network size={18} /> URL-karta</Link>
          <Link href="/admin/serps"><FileText size={18} /> SERPS</Link>
          <Link href="/"><ArrowLeft size={18} /> Kundsidan</Link>
        </nav>
      </aside>
      <section className="admin-content analytics-content">
        <header className="admin-topbar"><div><p>Besöksdata</p><h1>Statistik</h1></div><span className="analytics-live-badge"><Radio size={14} /> Live från webbplatsen</span></header>
        {error ? <p className="admin-alert" role="alert">{error}</p> : !stats ? <div className="admin-empty analytics-loading"><LoaderCircle className="admin-spinner" size={28} /> Hämtar statistik…</div> : (
          <>
            <div className="admin-stats analytics-stats">
              <article><span><Eye size={19} /></span><small>Besök senaste 24 h</small><strong>{stats.visitsDay}</strong></article>
              <article><span className="green"><Users size={19} /></span><small>Besök senaste 7 dagar</small><strong>{stats.visitsWeek}</strong></article>
              <article><span className="slate"><BarChart3 size={19} /></span><small>Besök senaste 30 dagar</small><strong>{stats.visitsMonth}</strong></article>
              <article><span className="amber"><CheckCircle2 size={19} /></span><small>Matchningar startade</small><strong>{stats.matchesMonth}</strong></article>
            </div>
            <div className="analytics-summary"><div><small>Partnerträffar senaste 30 dagar</small><strong>{stats.foundMonth}</strong></div><p>Besök räknas som anonyma sidvisningar. Inga IP-adresser, namn eller kontaktuppgifter sparas i statistiken.</p></div>
          </>
        )}
      </section>
    </main>
  );
}
