"use client";

import { BarChart3, CheckCircle2, Eye, LoaderCircle, Radio, Users } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = { visitsDay: number; visitsWeek: number; visitsMonth: number; matchesMonth: number; foundMonth: number };

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

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
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="brand admin-brand" href="/"><span className="brand-mark"><BarChart3 size={18} /></span><span>Elektrikerakut<span>.nu</span></span></Link>
        <nav aria-label="Adminnavigering">
          <Link href="/admin"><Users size={18} /> Partners</Link>
          <Link className="active" href="/admin/statistik"><BarChart3 size={18} /> Statistik</Link>
          <Link href="/"><span aria-hidden="true">←</span> Kundsidan</Link>
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
