"use client";

import {
  ArrowRight,
  BadgeCheck,
  Check,
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
import { type FormEvent, type ElementType, useEffect, useRef, useState } from "react";

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
  { id: "other", label: "Annat elproblem", hint: "Vi ringer upp och tar reda på detaljerna", icon: CircleEllipsis },
];

const loadingSteps = [
  "Analyserar din förfrågan",
  "Kontrollerar registrerade elföretag",
  "Matchar område och tillgänglighet",
  "Förbereder ditt resultat",
];

type Step = "issue" | "postcode" | "phone";
type ViewState = "form" | "loading" | "result" | "unavailable";
type AnalyticsEvent = "CTA_CLICK" | "FORM_ERROR" | "REQUEST_SUBMITTED" | "MATCH_STARTED" | "MATCH_FOUND" | "MATCH_NOT_FOUND" | "COVERAGE_UNAVAILABLE";
type MatchedPartner = {
  publicId: string;
  legalName: string;
  logoUrl: string | null;
  phone: string;
  website: string | null;
  serviceAreas: string;
  availability: string;
};

const steps: Step[] = ["issue", "postcode", "phone"];

function isStockholmPostcode(postcode: string) {
  const value = Number(postcode);
  return Number.isInteger(value) && ((value >= 10000 && value <= 19999) || (value >= 76000 && value <= 76999));
}

function formatCallbackTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

export default function Home() {
  const [step, setStep] = useState<Step>("issue");
  const [selectedIssue, setSelectedIssue] = useState("");
  const [postcode, setPostcode] = useState("");
  const [phone, setPhone] = useState("");
  const [view, setView] = useState<ViewState>("form");
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [matchedPartner, setMatchedPartner] = useState<MatchedPartner | null>(null);
  const [callbackSeconds, setCallbackSeconds] = useState(0);
  const [errors, setErrors] = useState<{ issue?: string; postcode?: string; phone?: string }>({});
  const matchCardRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const postcodeInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

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
      setProgress(Math.min((elapsed / 7000) * 100, 100));
      setLoadingStep(Math.min(Math.floor(elapsed / 1000), loadingSteps.length - 1));

      if (elapsed >= 7000) {
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

  useEffect(() => {
    if (view !== "result" || !matchedPartner) {
      return;
    }

    const interval = window.setInterval(() => {
      setCallbackSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [view, matchedPartner]);

  useEffect(() => {
    if (view !== "form") return;
    if (step === "postcode") postcodeInputRef.current?.focus();
    if (step === "phone") phoneInputRef.current?.focus();
  }, [step, view]);

  function normalizePostcode(value: string) {
    return value.replace(/\D/g, "").slice(0, 5);
  }

  function recordEvent(eventType: AnalyticsEvent) {
    void fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventType, path: window.location.pathname }),
      keepalive: true,
    });
  }

  function goToIssue(id: string) {
    setSelectedIssue(id);
    setErrors((current) => ({ ...current, issue: undefined }));
    setStep("postcode");
  }

  function goToPhoneStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{5}$/.test(postcode)) {
      setErrors((current) => ({ ...current, postcode: "Ange ett svenskt postnummer med fem siffror." }));
      return;
    }
    setErrors((current) => ({ ...current, postcode: undefined }));
    setStep("phone");
  }

  function goBack() {
    const index = steps.indexOf(step);
    if (index > 0) setStep(steps[index - 1]);
  }

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const digits = phone.replace(/\D/g, "");

    if (digits.length < 7) {
      setErrors((current) => ({ ...current, phone: "Ange ett telefonnummer där elektrikern kan nå dig." }));
      recordEvent("FORM_ERROR");
      return;
    }
    setErrors((current) => ({ ...current, phone: undefined }));

    setProgress(0);
    setLoadingStep(0);
    setMatchedPartner(null);
    const requestPromise = fetch("/api/requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ issue: selectedIssue, details: "", postcode, phone, accepted: true }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Förfrågan kunde inte sparas.");
        recordEvent("REQUEST_SUBMITTED");
        return await response.json() as { request?: { id: number } };
      });

    if (!isStockholmPostcode(postcode)) {
      setView("unavailable");
      recordEvent("COVERAGE_UNAVAILABLE");
      void requestPromise.catch(() => undefined);
      return;
    }

    setView("loading");
    recordEvent("MATCH_STARTED");
    void requestPromise
      .then(({ request }) => fetch("/api/match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ issue: selectedIssue, details: "", postcode, phone, requestId: request?.id }),
      }))
      .then(async (response) => {
        if (!response.ok) return null;
        const data = await response.json() as { match?: MatchedPartner | null };
        return data.match ?? null;
      })
      .then((match) => {
        if (match) recordEvent("MATCH_FOUND");
        else recordEvent("MATCH_NOT_FOUND");
        setCallbackSeconds(match ? 120 : 0);
        setMatchedPartner(match);
      })
      .catch(() => setMatchedPartner(null));
  }

  function resetSearch() {
    setStep("issue");
    setSelectedIssue("");
    setPostcode("");
    setPhone("");
    setProgress(0);
    setLoadingStep(0);
    setMatchedPartner(null);
    setCallbackSeconds(0);
    setErrors({});
    setView("form");
  }

  const stepIndex = steps.indexOf(step);

  return (
    <main className="lean-page">
      <header className="site-header lean-header">
        <a className="brand" href="#top" aria-label="Elektrikerakut.nu, startsida">
          <span className="brand-mark" aria-hidden="true"><Zap size={19} strokeWidth={2.6} /></span>
          <span>Elektrikerakut<span>.nu</span></span>
        </a>
        <a className="header-login" href="/admin/login" aria-label="Logga in" title="Logga in">
          <LogIn size={19} aria-hidden="true" />
        </a>
      </header>

      <section className="lean-hero" id="top">
        <div className="trust-row lean-trust-row" aria-label="Fördelar">
          <span><ShieldCheck size={18} /> Registerkontrollerade</span>
          <span><Clock3 size={18} /> Svar inom 2 minuter</span>
          <span><MapPin size={18} /> Stockholm med omnejd</span>
          <span><BadgeCheck size={18} /> Ingen bindning</span>
        </div>

        <div className="match-card lean-match-card" id="matchning" ref={matchCardRef}>
          <div className="card-topline">
            <span className="live-dot" />
            <span>Jour dygnet runt</span>
            {view === "form" && (
              <div className="step-progress" aria-hidden="true">
                {steps.map((value, index) => (
                  <span key={value} className={index <= stepIndex ? "done" : ""} />
                ))}
              </div>
            )}
          </div>

          {view === "form" && step === "issue" && (
            <div className="card-heading-wrap">
              <div className="card-heading">
                <p>Steg 1 av 3</p>
                <h2>Vad har hänt?</h2>
              </div>

              <fieldset aria-describedby={errors.issue ? "issue-error" : undefined}>
                <legend className="sr-only">Välj typ av elproblem</legend>
                <div className="issue-grid">
                  {issues.map((issue) => {
                    const Icon = issue.icon;
                    return (
                      <button
                        className="issue-option"
                        type="button"
                        key={issue.id}
                        onClick={() => goToIssue(issue.id)}
                      >
                        <span className="issue-icon"><Icon size={20} /></span>
                        <span><strong>{issue.label}</strong><small>{issue.hint}</small></span>
                        <span className="option-check option-arrow" aria-hidden="true"><ArrowRight size={15} /></span>
                      </button>
                    );
                  })}
                </div>
                {errors.issue && <p className="field-error" id="issue-error">{errors.issue}</p>}
              </fieldset>
            </div>
          )}

          {view === "form" && step === "postcode" && (
            <form onSubmit={goToPhoneStep} noValidate className="lean-step-form">
              <div className="card-heading-wrap">
                <div className="card-heading">
                  <p>Steg 2 av 3</p>
                  <h2>Vad har du för postnummer?</h2>
                </div>

                <label className="lean-field">
                  <span>Postnummer</span>
                  <input
                    ref={postcodeInputRef}
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

                <div className="lean-step-actions">
                  <button className="step-back" type="button" onClick={goBack}>Tillbaka</button>
                  <button className="submit-button" type="submit">Nästa <ArrowRight size={19} /></button>
                </div>
              </div>
            </form>
          )}

          {view === "form" && step === "phone" && (
            <form onSubmit={submitRequest} noValidate className="lean-step-form">
              <div className="card-heading-wrap">
                <div className="card-heading">
                  <p>Steg 3 av 3</p>
                  <h2>Vart ska vi ringa?</h2>
                </div>

                <label className="lean-field">
                  <span>Telefonnummer</span>
                  <input
                    ref={phoneInputRef}
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

                <div className="lean-step-actions">
                  <button className="step-back" type="button" onClick={goBack}>Tillbaka</button>
                  <button className="submit-button" type="submit">Starta matchning <ArrowRight size={19} /></button>
                </div>
                <p className="request-consent-note">Genom att skicka godkänner du att vi använder uppgifterna för att hantera din förfrågan. Läs <a href="/integritetspolicy">integritetspolicyn</a>.</p>
                <p className="disclosure">
                  Elektrikerakut.nu är en förmedlingstjänst och utför inte elinstallationsarbete.
                </p>
              </div>
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
                {loadingSteps.map((stepLabel, index) => (
                  <div className={index < loadingStep ? "done" : index === loadingStep ? "active" : ""} key={stepLabel}>
                    <span>{index < loadingStep ? <Check size={13} /> : index + 1}</span>
                    {stepLabel}
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
                <span className="partner-avatar">{matchedPartner?.logoUrl ? <span className="partner-logo" role="img" aria-label={`Logotyp för ${matchedPartner.legalName}`} style={{ backgroundImage: `url(${matchedPartner.logoUrl})` }} /> : <Zap size={22} />}</span>
                <span><small>{matchedPartner ? "Vald leverantör" : "Matchningsstatus"}</small><strong>{matchedPartner?.legalName ?? "Ingen aktiv partner hittades"}</strong></span>
                {matchedPartner && <BadgeCheck size={22} className="verified-icon" />}
              </div>
              <div className="result-details">
                <span><Clock3 size={17} /><small>{matchedPartner ? "Tillgänglighet" : "Återkoppling"}</small><strong>{matchedPartner?.availability ?? "Ingen bekräftad match"}</strong></span>
                <span><MapPin size={17} /><small>Område</small><strong>{matchedPartner?.serviceAreas ?? `${postcode.slice(0, 3)} **`}</strong></span>
              </div>
              {matchedPartner && (
                <div className="callback-promise" role="status" aria-live="polite">
                  <PhoneCall size={20} />
                  <span>
                    <strong>Vi ringer dig inom 2 minuter</strong>
                    <small>Beräknad tid kvar: {formatCallbackTimer(callbackSeconds)}</small>
                  </span>
                </div>
              )}
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
    </main>
  );
}
