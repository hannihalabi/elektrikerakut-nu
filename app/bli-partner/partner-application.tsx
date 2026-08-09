"use client";

import { ArrowLeft, ArrowRight, BadgeCheck, Check, CheckCircle2, Clock3, MapPin, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";

const capabilityOptions = ["Akut felsökning", "Strömlöst", "Elcentral och säkringar", "Uttag och installation", "Företag och fastighet"];

type FormState = {
  legalName: string;
  organizationNumber: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  serviceAreas: string;
  capabilities: string[];
  availability: string;
  notes: string;
  accepted: boolean;
  companyWebsite: string;
};

const emptyForm: FormState = {
  legalName: "", organizationNumber: "", contactName: "", email: "", phone: "", website: "",
  serviceAreas: "", capabilities: [], availability: "", notes: "", accepted: false, companyWebsite: "",
};

export function PartnerApplication() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");

  function field<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function toggleCapability(value: string) {
    const next = form.capabilities.includes(value)
      ? form.capabilities.filter((item) => item !== value)
      : [...form.capabilities, value];
    field("capabilities", next);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/partners", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, startedAt }),
      });
      const data = await response.json() as { error?: string; reference?: string };
      if (!response.ok) throw new Error(data.error ?? "Ansökan kunde inte skickas.");
      setReference(data.reference ?? "MOTTAGEN");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Ansökan kunde inte skickas.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setForm(emptyForm);
    setStartedAt(Date.now());
    setReference("");
    setError("");
  }

  return (
    <main className="partner-site">
      <header className="site-header partner-header">
        <Link className="brand" href="/" aria-label="Elektrikerakut.nu, startsida">
          <span className="brand-mark" aria-hidden="true"><Zap size={19} strokeWidth={2.6} /></span>
          <span>Elektrikerakut<span>.nu</span></span>
        </Link>
        <Link className="back-link" href="/"><ArrowLeft size={17} /> Till kundsidan</Link>
      </header>

      <section className="partner-hero">
        <div className="partner-intro">
          <div className="eyebrow"><span /> Partnernätverk Stockholm</div>
          <h1>Fyll luckor i jouren.<br /><em>Betala för bokningar.</em></h1>
          <p>Ta emot strukturerade förfrågningar från kunder i ditt aktiva område. Du styr själv geografi, tider och kapacitet.</p>
          <div className="partner-benefits">
            <div><BadgeCheck size={21} /><span><strong>Kvalificerade bokningar</strong><small>Nåbar kund, rätt område och verkligt elbehov.</small></span></div>
            <div><MapPin size={21} /><span><strong>Du styr täckningen</strong><small>Välj postnummer, tider och vilka uppdrag ni tar.</small></span></div>
            <div><Clock3 size={21} /><span><strong>Snabb accept</strong><small>Acceptera eller avböj digitalt med tydligt underlag.</small></span></div>
          </div>
          <p className="partner-price"><strong>Pilot:</strong> 1 000 kr exkl. moms per accepterad kvalificerad bokning. Ingen startavgift eller lång bindning.</p>
        </div>

        <div className="partner-form-card">
          {!reference ? (
            <form onSubmit={submit}>
              <div className="card-heading">
                <p>Partneransökan</p>
                <h2>Berätta om företaget</h2>
              </div>

              <div className="form-section-label"><span>1</span> Företagsuppgifter</div>
              <div className="partner-field-grid">
                <label className="wide"><span>Juridiskt företagsnamn *</span><input required autoComplete="organization" value={form.legalName} onChange={(e) => field("legalName", e.target.value)} /></label>
                <label><span>Organisationsnummer *</span><input required inputMode="numeric" placeholder="XXXXXX-XXXX" value={form.organizationNumber} onChange={(e) => field("organizationNumber", e.target.value)} /></label>
                <label><span>Webbplats</span><input type="url" placeholder="https://" value={form.website} onChange={(e) => field("website", e.target.value)} /></label>
                <label><span>Kontaktperson *</span><input required autoComplete="name" value={form.contactName} onChange={(e) => field("contactName", e.target.value)} /></label>
                <label><span>Telefon *</span><input required inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => field("phone", e.target.value)} /></label>
                <label className="wide"><span>E-post *</span><input required type="email" autoComplete="email" value={form.email} onChange={(e) => field("email", e.target.value)} /></label>
              </div>

              <div className="form-section-label"><span>2</span> Kapacitet och område</div>
              <label className="standalone-label"><span>Serviceområde eller postnummer *</span><textarea required rows={2} placeholder="Exempel: Stockholm city, Solna och Sundbyberg" value={form.serviceAreas} onChange={(e) => field("serviceAreas", e.target.value)} /></label>
              <fieldset className="capability-fieldset">
                <legend>Vilka uppdrag vill ni ta emot? *</legend>
                <div className="capability-grid">
                  {capabilityOptions.map((option) => {
                    const selected = form.capabilities.includes(option);
                    return <button type="button" aria-pressed={selected} className={selected ? "selected" : ""} key={option} onClick={() => toggleCapability(option)}><span>{selected && <Check size={13} />}</span>{option}</button>;
                  })}
                </div>
              </fieldset>
              <label className="standalone-label"><span>Öppettider och jourkapacitet *</span><textarea required rows={2} placeholder="Exempel: Vardagar 17–23, helger 08–23. Två montörer." value={form.availability} onChange={(e) => field("availability", e.target.value)} /></label>
              <label className="standalone-label"><span>Övrigt</span><textarea rows={3} maxLength={1000} placeholder="Försäkring, arbetstyper eller annan information som hjälper granskningen" value={form.notes} onChange={(e) => field("notes", e.target.value)} /></label>

              <label className="honeypot" aria-hidden="true">Företagets extra webbplats<input tabIndex={-1} autoComplete="off" value={form.companyWebsite} onChange={(e) => field("companyWebsite", e.target.value)} /></label>
              <label className="partner-consent"><input required type="checkbox" checked={form.accepted} onChange={(e) => field("accepted", e.target.checked)} /><span>Jag bekräftar att uppgifterna är korrekta och att Elektrikerakut.nu får kontakta företaget för verifiering och partnerdialog.</span></label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="submit-button" type="submit" disabled={submitting}>{submitting ? "Skickar ansökan…" : "Skicka partneransökan"}<ArrowRight size={18} /></button>
              <p className="partner-privacy"><ShieldCheck size={15} /> Ansökan blir inte aktiv förrän registrering och uppgifter har granskats.</p>
            </form>
          ) : (
            <div className="partner-success" aria-live="polite">
              <span><CheckCircle2 size={38} /></span>
              <p className="loading-kicker">Ansökan mottagen</p>
              <h2>Tack för er ansökan.</h2>
              <p>Vi granskar registrering, verksamhetstyper och kapacitet innan företaget kan ta emot bokningar.</p>
              <div><small>Referens</small><strong>{reference}</strong></div>
              <button className="secondary-button" type="button" onClick={reset}>Skicka en ny ansökan</button>
              <Link href="/">Till Elektrikerakut.nu</Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
