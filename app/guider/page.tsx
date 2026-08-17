import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, ShieldCheck, Zap } from "lucide-react";
import { guidePosts } from "./posts";
import { GuideLibrary } from "./guide-library";
import { servicePhotos } from "../site-photos";

export const metadata: Metadata = {
  title: "Elguiden | Råd vid strömavbrott, säkringar och elfel",
  description: "Praktiska och säkerhetsfokuserade guider om vanliga elfel hemma – från jordfelsbrytare till strömavbrott.",
  alternates: { canonical: "/guider" },
};

export default function GuidesPage() {
  return <main className="guide-site">
    <header className="guide-header"><Link className="brand" href="/"><span className="brand-mark"><Zap size={18} /></span><span>Elektrikerakut<span>.nu</span></span></Link><Link className="guide-header-cta" href="/eljour">Behöver du hjälp nu? <ArrowRight size={16} /></Link></header>
    <section className="guide-hero">
      <div className="guide-hero-copy">
        <span><BookOpen size={17} /> Elguiden</span>
        <h1>Trygga svar när något är fel med elen</h1>
        <p>Praktiska guider om vanliga elproblem hemma. Läs vad du kan kontrollera säkert – och när du ska ta hjälp av en registrerad elinstallatör.</p>
        <div><ShieldCheck size={18} /> Säkerhet först. Vid brand eller akut fara: ring 112.</div>
      </div>
      <figure className="guide-hero-photo"><Image src={servicePhotos[0]} alt="Elektriker vid servicebil utanför en villa" width={1448} height={1086} sizes="(max-width: 900px) calc(100vw - 40px), 480px" priority /></figure>
    </section>
    <GuideLibrary posts={guidePosts} />
    <section className="guide-emergency"><div><ShieldCheck size={23} /><div><strong>Osäker på om felet är akut?</strong><p>Bränd lukt, värme, rök eller återkommande utlösta säkringar ska tas på allvar.</p></div></div><Link href="/eljour">Hitta elektriker <ArrowRight size={16} /></Link></section>
  </main>;
}
