"use client";

import Link from "next/link";
import { ArrowRight, Check, CircleEllipsis, PlugZap, Power, ShieldCheck, TriangleAlert, Zap } from "lucide-react";
import { type ElementType, type FormEvent, useEffect, useRef, useState } from "react";

type Issue = {
  id: string;
  label: string;
  hint: string;
  icon: ElementType;
};

type FormState = "form" | "submitting" | "complete";

const issues: Issue[] = [
  { id: "power", label: "Helt eller delvis strömlöst", hint: "Bostaden eller delar av den", icon: Power },
  { id: "breaker", label: "Säkring eller jordfelsbrytare", hint: "Löser ut eller går inte att återställa", icon: Zap },
  { id: "outlet", label: "Uttag eller elcentral", hint: "Fel, värme eller synlig skada", icon: PlugZap },
  { id: "risk", label: "Lukt, ljud eller annan risk", hint: "Något känns inte säkert", icon: TriangleAlert },
  { id: "other", label: "Annat elproblem", hint: "Beskriv kort för elektrikern", icon: CircleEllipsis },
];

type Props = {
  areaName: string;
  postcodePrefix: string;
};

export default function LocalMatchForm({ areaName, postcodePrefix }: Props) {
  const [selectedIssue, setSelectedIssue] = useState("");
  const [details, setDetails] = useState("");
  const [postcode, setPostcode] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<FormState>("form");
  const [errors, setErrors] = useState<{ issue?: string; details?: string; postcode?: string; phone?: string; submit?: string }>({});
  const matchSectionRef = useRef<HTMLElement>(null);

  const postcodePlaceholder = `${postcodePrefix}${"0".repeat(5 - postcodePrefix.length)}`.replace(/(\d{3})(\d{2})/, "$1 $2");

  function clearError(name: keyof typeof errors) {
    setErrors((current) => ({ ...current, [name]: undefined, submit: undefined }));
  }

  useEffect(() => {
    if (state !== "complete") return;

    const frame = window.requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      matchSectionRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [state]);

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const digits = phone.replace(/\D/g, "");
    const nextErrors: typeof errors = {};

    if (!selectedIssue) nextErrors.issue = "Välj det som bäst beskriver problemet.";
    if (selectedIssue === "other" && details.trim().length < 5) nextErrors.details = "Beskriv kort vad som har hänt.";
    if (!/^\d{5}$/.test(postcode)) nextErrors.postcode = "Ange ett svenskt postnummer med fem siffror.";
    if (digits.length < 7) nextErrors.phone = "Ange ett telefonnummer där elektrikern kan nå dig.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setState("submitting");
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ issue: selectedIssue, details: details.trim(), postcode, phone, accepted: true }),
      });
      if (!response.ok) throw new Error("Request failed");

      const { request } = await response.json() as { request?: { id: number } };
      void fetch("/api/match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ issue: selectedIssue, details: details.trim(), postcode, phone, requestId: request?.id }),
      });
      void fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ eventType: "REQUEST_SUBMITTED", path: window.location.pathname }),
        keepalive: true,
      });
      setState("complete");
    } catch {
      setState("form");
      setErrors({ submit: "Förfrågan kunde inte skickas just nu. Försök gärna igen om en stund." });
    }
  }

  if (state === "complete") {
    return (
      <section className="local-match-section" id="matchning" ref={matchSectionRef} aria-labelledby="local-match-heading">
        <div className="local-match-card local-match-success" tabIndex={-1} aria-live="polite">
          <div className="result-check"><Check size={30} strokeWidth={2.5} /></div>
          <p className="loading-kicker">Förfrågan mottagen</p>
          <h2 id="local-match-heading">Tack — vi återkommer snart</h2>
          <p>Vi har tagit emot din förfrågan för {areaName}. En medarbetare kontaktar dig så snart som möjligt för att bekräfta nästa steg.</p>
          <p className="privacy-line"><ShieldCheck size={15} /> En förfrågan är kostnadsfri. Partnern utför och fakturerar arbetet direkt.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="local-match-section" id="matchning" ref={matchSectionRef} aria-labelledby="local-match-heading">
      <div className="local-match-intro">
        <p className="local-seo-eyebrow">Snabb hjälp i {areaName}</p>
        <h2 id="local-match-heading">Beskriv problemet — vi tar hand om resten</h2>
        <p>Fyll i uppgifterna på ungefär 30 sekunder så får du kontakt med rätt elföretag för jobbet.</p>
      </div>

      <div className="local-match-card">
        <div className="card-topline"><span className="live-dot" /><span>Snabb matchning</span></div>
        <form onSubmit={submitRequest} noValidate>
          <div className="card-heading"><p>Tar cirka 30 sekunder</p><h2>Vad har hänt?</h2></div>
          <fieldset aria-describedby={errors.issue ? "local-issue-error" : undefined}>
            <legend className="sr-only">Välj typ av elproblem</legend>
            <div className="issue-grid">
              {issues.map((issue) => {
                const Icon = issue.icon;
                const selected = selectedIssue === issue.id;
                return <button className={`issue-option${selected ? " selected" : ""}`} type="button" key={issue.id} aria-pressed={selected} onClick={() => { setSelectedIssue(issue.id); if (issue.id !== "other") setDetails(""); clearError("issue"); clearError("details"); }}>
                  <span className="issue-icon"><Icon size={20} /></span><span><strong>{issue.label}</strong><small>{issue.hint}</small></span><span className="option-check" aria-hidden="true"><Check size={13} /></span>
                </button>;
              })}
            </div>
            {errors.issue && <p className="field-error" id="local-issue-error">{errors.issue}</p>}
          </fieldset>

          {selectedIssue === "other" && <label className="details-field"><span>Beskriv kort vad som hänt</span><textarea rows={3} maxLength={500} value={details} aria-invalid={Boolean(errors.details)} onChange={(event) => { setDetails(event.target.value); clearError("details"); }} placeholder="Exempel: Lamporna blinkar och det luktar bränt från elcentralen." />{errors.details && <small className="field-error">{errors.details}</small>}</label>}

          <div className="contact-fields">
            <label><span>Postnummer</span><input inputMode="numeric" autoComplete="postal-code" placeholder={postcodePlaceholder} value={postcode} aria-invalid={Boolean(errors.postcode)} onChange={(event) => { setPostcode(event.target.value.replace(/\D/g, "").slice(0, 5)); clearError("postcode"); }} />{errors.postcode && <small className="field-error">{errors.postcode}</small>}</label>
            <label><span>Telefonnummer</span><input inputMode="tel" autoComplete="tel" placeholder="070-123 45 67" value={phone} aria-invalid={Boolean(errors.phone)} onChange={(event) => { setPhone(event.target.value.slice(0, 20)); clearError("phone"); }} />{errors.phone && <small className="field-error">{errors.phone}</small>}</label>
          </div>
          <button className="submit-button" type="submit" disabled={state === "submitting"}>{state === "submitting" ? "Skickar förfrågan…" : <>Hitta elektriker nu <ArrowRight size={19} /></>}</button>
          <p className="request-consent-note">Genom att skicka godkänner du att vi använder uppgifterna för att hantera din förfrågan. <Link href="/integritetspolicy">Läs integritetspolicyn</Link>.</p>
          {errors.submit && <p className="field-error consent-error" role="alert">{errors.submit}</p>}
          <p className="privacy-line"><ShieldCheck size={15} /> En förfrågan är kostnadsfri. Partnern utför och fakturerar arbetet direkt.</p>
          <p className="disclosure">Elektrikerakut.nu är en förmedlingstjänst och utför inte elinstallationsarbete.</p>
        </form>
      </div>
    </section>
  );
}
