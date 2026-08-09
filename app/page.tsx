"use client";

import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  CircleEllipsis,
  Clock3,
  LogIn,
  MapPin,
  PhoneCall,
  PlugZap,
  Power,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { type FormEvent, type ElementType, useEffect, useRef, useState } from "react";
import personalImage from "../public/personal2.png";

type Issue = {
  id: string;
  label: string;
  hint: string;
  icon: ElementType;
};

const issues: Issue[] = [
  { id: "power", label: "Helt eller delvis strömlöst", hint: "Bostaden eller delar av den", icon: Power },
  { id: "breaker", label: "Säkring eller jordfelsbrytare", hint: "Löser ut eller går inte att återställa", icon: Zap },
  { id: "outlet", label: "Uttag eller elcentral", hint: "Fel, värme eller synlig skada", icon: PlugZap },
  { id: "risk", label: "Lukt, ljud eller annan risk", hint: "Något känns inte säkert", icon: TriangleAlert },
  { id: "other", label: "Annat elproblem", hint: "Beskriv kort för elektrikern", icon: CircleEllipsis },
];

const loadingSteps = [
  "Analyserar din förfrågan",
  "Kontrollerar registrerade elföretag",
  "Matchar område och tillgänglighet",
  "Förbereder ditt resultat",
];

type ViewState = "form" | "loading" | "result" | "unavailable";
type MatchedPartner = {
  publicId: string;
  legalName: string;
  phone: string;
  website: string | null;
  serviceAreas: string;
  availability: string;
};

function isStockholmPostcode(postcode: string) {
  const value = Number(postcode);
  return Number.isInteger(value) && value >= 10000 && value <= 19999;
}

export default function Home() {
  const [selectedIssue, setSelectedIssue] = useState("");
  const [postcode, setPostcode] = useState("");
  const [phone, setPhone] = useState("");
  const [view, setView] = useState<ViewState>("form");
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [matchedPartner, setMatchedPartner] = useState<MatchedPartner | null>(null);
  const [errors, setErrors] = useState<{ issue?: string; postcode?: string; phone?: string }>({});
  const matchCardRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (view !== "loading") return;

    const frame = window.requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      matchCardRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [view]);

  useEffect(() => {
    if (view !== "loading") return;

    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setProgress(Math.min((elapsed / 4000) * 100, 100));
      setLoadingStep(Math.min(Math.floor(elapsed / 1000), loadingSteps.length - 1));

      if (elapsed >= 4000) {
        window.clearInterval(interval);
        setProgress(100);
        setView("result");
      }
    }, 60);

    return () => window.clearInterval(interval);
  }, [view]);

  useEffect(() => {
    if (view === "result" || view === "unavailable") resultRef.current?.focus();
  }, [view]);

  function normalizePostcode(value: string) {
    return value.replace(/\D/g, "").slice(0, 5);
  }

  function recordEvent(eventType: "MATCH_STARTED" | "MATCH_FOUND") {
    void fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventType, path: window.location.pathname }),
      keepalive: true,
    });
  }

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const digits = phone.replace(/\D/g, "");
    const nextErrors: typeof errors = {};

    if (!selectedIssue) nextErrors.issue = "Välj det som bäst beskriver problemet.";
    if (!/^\d{5}$/.test(postcode)) nextErrors.postcode = "Ange ett svenskt postnummer med fem siffror.";
    if (digits.length < 7) nextErrors.phone = "Ange ett telefonnummer där elektrikern kan nå dig.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    if (!isStockholmPostcode(postcode)) {
      setView("unavailable");
      return;
    }

    setProgress(0);
    setLoadingStep(0);
    setMatchedPartner(null);
    setView("loading");
    recordEvent("MATCH_STARTED");
    void fetch("/api/match", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ issue: selectedIssue, postcode }),
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const data = await response.json() as { match?: MatchedPartner | null };
        return data.match ?? null;
      })
      .then((match) => {
        if (match) recordEvent("MATCH_FOUND");
        setMatchedPartner(match);
      })
      .catch(() => setMatchedPartner(null));
  }

  function resetSearch() {
    setSelectedIssue("");
    setPostcode("");
    setPhone("");
    setProgress(0);
    setLoadingStep(0);
    setMatchedPartner(null);
    setErrors({});
    setView("form");
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Elektrikerakut.nu, startsida">
          <span className="brand-mark" aria-hidden="true"><Zap size={19} strokeWidth={2.6} /></span>
          <span>Elektrikerakut<span>.nu</span></span>
        </a>
        <nav aria-label="Huvudnavigering">
          <a href="#sa-fungerar-det">Så fungerar det</a>
          <a href="#trygghet">Trygg matchning</a>
        </nav>
        <div className="header-actions">
          <a className="header-partner" href="/bli-partner">Bli partner</a>
          <a className="header-action" href="#matchning"><PhoneCall size={17} /> Ring jouren</a>
          <a className="header-login" href="/admin/login" aria-label="Logga in" title="Logga in">
            <LogIn size={19} aria-hidden="true" />
          </a>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="hero-copy">
          <div className="eyebrow"><span /> Jour dygnet runt</div>
          <h1>Akut elproblem?<br /><em>Vi står redo.</em></h1>
          <figure className="hero-team">
            <Image
              src={personalImage}
              alt="Teamet bakom Elektrikerakut.nu samlat framför företagets skylt"
              fill
              sizes="(max-width: 700px) calc(100vw - 32px), (max-width: 980px) 560px, 590px"
              placeholder="blur"
              quality={82}
            />
            <figcaption>
              <span><i className="live-dot" aria-hidden="true" /> Personlig jourkontakt</span>
              <strong>Teamet bakom Elektrikerakut.nu</strong>
            </figcaption>
          </figure>
          <p className="hero-lead">
            Vi kvalificerar elföretagen och skapar prispress på jouruppdragen – så att du får snabb, trygg hjälp utan onödiga kostnader.
          </p>
          <div className="hero-actions">
            <a className="primary-link" href="#matchning"><Zap size={18} fill="currentColor" /> Hitta elektriker nu <ArrowRight size={18} /></a>
            <a className="secondary-link" href="#matchning"><PhoneCall size={18} /> Ring för snabb hjälp</a>
          </div>
          <div className="trust-row" aria-label="Fördelar">
            <span><ShieldCheck size={18} /> Registerkontrollerade partners</span>
            <span><Clock3 size={18} /> Snabb återkoppling</span>
            <span><MapPin size={18} /> Stockholm med omnejd</span>
          </div>
        </div>

        <div className="match-card" id="matchning" ref={matchCardRef}>
          <div className="card-topline">
            <span className="live-dot" />
            <span>Snabb matchning</span>
            <small>Prototypläge</small>
          </div>

          {view === "form" && (
            <form onSubmit={submitRequest} noValidate>
              <div className="card-heading">
                <p>Tar cirka 30 sekunder</p>
                <h2>Vad har hänt?</h2>
              </div>

              <fieldset aria-describedby={errors.issue ? "issue-error" : undefined}>
                <legend className="sr-only">Välj typ av elproblem</legend>
                <div className="issue-grid">
                  {issues.map((issue) => {
                    const Icon = issue.icon;
                    const selected = selectedIssue === issue.id;
                    return (
                      <button
                        className={`issue-option${selected ? " selected" : ""}`}
                        type="button"
                        key={issue.id}
                        aria-pressed={selected}
                        onClick={() => {
                          setSelectedIssue(issue.id);
                          setErrors((current) => ({ ...current, issue: undefined }));
                        }}
                      >
                        <span className="issue-icon"><Icon size={20} /></span>
                        <span><strong>{issue.label}</strong><small>{issue.hint}</small></span>
                        <span className="option-check" aria-hidden="true"><Check size={13} /></span>
                      </button>
                    );
                  })}
                </div>
                {errors.issue && <p className="field-error" id="issue-error">{errors.issue}</p>}
              </fieldset>

              <div className="contact-fields">
                <label>
                  <span>Postnummer</span>
                  <input
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="114 35"
                    value={postcode}
                    aria-invalid={Boolean(errors.postcode)}
                    onChange={(event) => {
                      setPostcode(normalizePostcode(event.target.value));
                      setErrors((current) => ({ ...current, postcode: undefined }));
                    }}
                  />
                  {errors.postcode && <small className="field-error">{errors.postcode}</small>}
                </label>
                <label>
                  <span>Telefonnummer</span>
                  <input
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="070-123 45 67"
                    value={phone}
                    aria-invalid={Boolean(errors.phone)}
                    onChange={(event) => {
                      setPhone(event.target.value.slice(0, 20));
                      setErrors((current) => ({ ...current, phone: undefined }));
                    }}
                  />
                  {errors.phone && <small className="field-error">{errors.phone}</small>}
                </label>
              </div>

              <button className="submit-button" type="submit">Hitta elektriker nu <ArrowRight size={19} /></button>
              <p className="privacy-line"><ShieldCheck size={15} /> Prototyp: inga uppgifter skickas eller sparas ännu.</p>
              <p className="disclosure">
                Elektrikerakut.nu är en förmedlingstjänst och utför inte elinstallationsarbete. Avtal om besök, pris och arbete ingås direkt med företaget som accepterar uppdraget.
              </p>
            </form>
          )}

          {view === "loading" && (
            <div className="loading-panel" aria-live="polite" aria-busy="true">
              <div className="search-visual" aria-hidden="true">
                <span className="search-ring ring-one" />
                <span className="search-ring ring-two" />
                <span className="search-core"><Zap size={27} fill="currentColor" /></span>
              </div>
              <p className="loading-kicker">Söker åt dig</p>
              <h2>{loadingSteps[loadingStep]}<span className="animated-dots">…</span></h2>
              <p>Vi går igenom tillgänglighet och matchar din förfrågan med rätt kompetens.</p>
              <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
                <span style={{ width: `${progress}%` }} />
              </div>
              <div className="loading-checklist">
                {loadingSteps.map((step, index) => (
                  <div className={index < loadingStep ? "done" : index === loadingStep ? "active" : ""} key={step}>
                    <span>{index < loadingStep ? <Check size={13} /> : index + 1}</span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === "result" && (
            <div className="result-panel" ref={resultRef} tabIndex={-1} aria-live="polite">
              <div className="result-check"><Check size={30} strokeWidth={2.5} /></div>
              <p className="loading-kicker">Matchningsflödet är klart</p>
              <h2>{matchedPartner ? "Vi hittade rätt hjälp" : "Din förfrågan är redo"}</h2>
              <p>{matchedPartner ? "En aktiv partner matchar ditt område och den typ av elproblem du valt." : "Vi hittade ingen aktiv partner som matchar både område och kompetens just nu."}</p>
              <div className="result-preview">
                <span className="partner-avatar"><Zap size={22} /></span>
                <span><small>{matchedPartner ? "Vald leverantör" : "Matchningsstatus"}</small><strong>{matchedPartner?.legalName ?? "Ingen aktiv partner hittades"}</strong></span>
                {matchedPartner && <BadgeCheck size={22} className="verified-icon" />}
              </div>
              <div className="result-details">
                <span><Clock3 size={17} /><small>{matchedPartner ? "Tillgänglighet" : "Återkoppling"}</small><strong>{matchedPartner?.availability ?? "Ingen bekräftad match"}</strong></span>
                <span><MapPin size={17} /><small>Område</small><strong>{matchedPartner?.serviceAreas ?? `${postcode.slice(0, 3)} **`}</strong></span>
              </div>
              {matchedPartner && <a className="submit-button" href={`tel:${matchedPartner.phone}`}><PhoneCall size={18} /> Ring {matchedPartner.legalName}</a>}
              <button className="submit-button" type="button" onClick={resetSearch}><RotateCcw size={18} /> Starta ny sökning</button>
              <p className="privacy-line">{matchedPartner ? "Partnern utför och fakturerar arbetet direkt." : "Försök igen senare när fler partners är aktiva i området."}</p>
            </div>
          )}

          {view === "unavailable" && (
            <div className="result-panel unavailable-panel" ref={resultRef} tabIndex={-1} role="status" aria-live="polite">
              <div className="result-check unavailable-check"><MapPin size={30} strokeWidth={2.3} /></div>
              <p className="loading-kicker">Området saknar täckning</p>
              <h2>Ops! Vi har just nu inga partners utanför Stockholm</h2>
              <p>Vi bygger ut nätverket löpande. För närvarande kan vi bara matcha förfrågningar inom Stockholm.</p>
              <div className="unavailable-postcode"><small>Ditt postnummer</small><strong>{postcode.slice(0, 3)} **</strong></div>
              <button className="submit-button" type="button" onClick={resetSearch}><RotateCcw size={18} /> Prova ett annat postnummer</button>
            </div>
          )}
        </div>
      </section>

      <section className="safety-note" aria-label="Viktig säkerhetsinformation">
        <span><TriangleAlert size={22} /></span>
        <p><strong>Brand, rök eller omedelbar personfara?</strong> Lämna platsen och ring 112. Rör inte skadad elektrisk utrustning.</p>
      </section>

      <section className="how-section" id="sa-fungerar-det">
        <div className="section-heading">
          <p>Så fungerar det</p>
          <h2>Från problem till rätt hjälp.<br />Utan onödiga omvägar.</h2>
        </div>
        <div className="steps-grid">
          <article><span>01</span><div className="step-icon"><Zap size={23} /></div><h3>Beskriv läget</h3><p>Välj problemet och ange postnummer och telefonnummer.</p></article>
          <article><span>02</span><div className="step-icon"><ShieldCheck size={23} /></div><h3>Vi matchar</h3><p>Systemet kontrollerar område, kapacitet och verifierad registrering.</p></article>
          <article><span>03</span><div className="step-icon"><PhoneCall size={23} /></div><h3>Partnern bekräftar</h3><p>Du får veta vem som kontaktar dig samt villkor för nästa steg.</p></article>
        </div>
      </section>

      <section className="confidence-section" id="trygghet">
        <div className="confidence-copy">
          <p className="section-label">Trygg matchning</p>
          <h2>Rätt företag.<br />Tydligt ansvar.</h2>
          <p>Vi kontrollerar partnerföretagets registrering och matchar bara inom de områden och tider där partnern uppgett kapacitet.</p>
          <a href="https://www.elsakerhetsverket.se/kolla-elforetaget/" target="_blank" rel="noreferrer">Kolla elföretaget hos Elsäkerhetsverket <ArrowRight size={17} /></a>
        </div>
        <div className="confidence-card">
          <div><BadgeCheck size={25} /><span><strong>Registrering kontrolleras</strong><small>Mot Elsäkerhetsverkets register</small></span></div>
          <div><MapPin size={25} /><span><strong>Område och kapacitet</strong><small>Matchning efter faktisk täckning</small></span></div>
          <div><ShieldCheck size={25} /><span><strong>Transparent ansvar</strong><small>Partnern utför och fakturerar arbetet</small></span></div>
        </div>
      </section>

      <section className="faq-section">
        <div className="section-heading compact"><p>Vanliga frågor</p><h2>Det viktigaste, direkt.</h2></div>
        <div className="faq-list">
          <details><summary>Är Elektrikerakut.nu ett elföretag?<ChevronDown size={19} /></summary><p>Nej. Tjänsten förmedlar din förfrågan till ett registrerat elinstallationsföretag. Det företaget bedömer, utför och fakturerar arbetet.</p></details>
          <details><summary>Vad kostar det?<ChevronDown size={19} /></summary><p>Det är kostnadsfritt att skicka en förfrågan. Partnerföretaget informerar om besöksavgift, jourpåslag, pris och villkor innan ni ingår avtal.</p></details>
          <details><summary>Är hjälp garanterad?<ChevronDown size={19} /></summary><p>Nej. Tillgänglighet beror på område, tid, problemtyp och partnerkapacitet. Vi visar aldrig en bekräftad matchning innan ett företag har accepterat.</p></details>
          <details><summary>Hur används mina uppgifter?<ChevronDown size={19} /></summary><p>I skarp drift används minsta nödvändiga information för att kvalificera och förmedla förfrågan till en vald partner. Den här prototypen skickar eller sparar inga formuläruppgifter.</p></details>
        </div>
      </section>

      <footer>
        <a className="brand footer-brand" href="#top"><span className="brand-mark"><Zap size={18} /></span><span>Elektrikerakut<span>.nu</span></span></a>
        <p>En snabb och transparent matchningstjänst för akuta elproblem i Stockholm.</p>
        <div><a href="#matchning">Hitta elektriker</a><a href="#sa-fungerar-det">Så fungerar det</a><a href="#trygghet">Trygghet</a><a href="/bli-partner">Bli partner</a></div>
        <small>Prototyp – juridisk identitet, kontaktuppgifter, integritetspolicy, kakor och villkor kompletteras före publik lansering.</small>
      </footer>

      <div className="mobile-actions">
        <a href="#matchning"><PhoneCall size={18} /> Ring</a>
        <a href="#matchning">Hitta elektriker <ArrowRight size={17} /></a>
      </div>
    </main>
  );
}
