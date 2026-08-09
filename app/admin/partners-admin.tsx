"use client";

import { ArrowLeft, BadgeCheck, Building2, Check, ChevronDown, Clock3, ExternalLink, LogOut, Mail, MapPin, Pause, Phone, Plus, Search, ShieldCheck, UserRound, X, Zap } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";

type Status = "PENDING" | "ACTIVE" | "PAUSED" | "REJECTED";
type Partner = {
  id: number;
  publicId: string;
  legalName: string;
  organizationNumber: string;
  contactName: string;
  email: string;
  phone: string;
  website: string | null;
  serviceAreas: string;
  capabilities: string[];
  availability: string;
  notes: string | null;
  source: "SELF_SERVICE" | "ADMIN";
  status: Status;
  registrationVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type NewPartner = {
  legalName: string; organizationNumber: string; contactName: string; email: string; phone: string;
  website: string; serviceAreas: string; capabilities: string[]; availability: string; notes: string;
};

const capabilities = ["Akut felsökning", "Strömlöst", "Elcentral och säkringar", "Uttag och installation", "Företag och fastighet"];
const emptyPartner: NewPartner = { legalName: "", organizationNumber: "", contactName: "", email: "", phone: "", website: "", serviceAreas: "", capabilities: [], availability: "", notes: "" };
const statusLabels: Record<Status, string> = { PENDING: "Väntar på granskning", ACTIVE: "Aktiv", PAUSED: "Pausad", REJECTED: "Avslagen" };

export function PartnersAdmin({ displayName }: { displayName: string }) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | Status>("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState<NewPartner>(emptyPartner);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/partners", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { partners?: Partner[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Partnerregistret kunde inte hämtas.");
        if (active) setPartners(data.partners ?? []);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Partnerregistret kunde inte hämtas.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => partners.filter((partner) => {
    const matchesStatus = filter === "ALL" || partner.status === filter;
    const haystack = `${partner.legalName} ${partner.organizationNumber} ${partner.contactName} ${partner.serviceAreas}`.toLowerCase();
    return matchesStatus && haystack.includes(query.toLowerCase());
  }), [partners, filter, query]);

  const counts = useMemo(() => ({
    all: partners.length,
    pending: partners.filter((partner) => partner.status === "PENDING").length,
    active: partners.filter((partner) => partner.status === "ACTIVE").length,
    paused: partners.filter((partner) => partner.status === "PAUSED").length,
  }), [partners]);

  function field<K extends keyof NewPartner>(key: K, value: NewPartner[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function toggleCapability(value: string) {
    field("capabilities", draft.capabilities.includes(value) ? draft.capabilities.filter((item) => item !== value) : [...draft.capabilities, value]);
  }

  async function createPartner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/partners", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) });
      const data = await response.json() as { partner?: Partner; error?: string };
      if (!response.ok || !data.partner) throw new Error(data.error ?? "Partnern kunde inte registreras.");
      setPartners((current) => [data.partner!, ...current]);
      setDraft(emptyPartner);
      setShowCreate(false);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Partnern kunde inte registreras.");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: number, status: Status) {
    setUpdatingId(id);
    setError("");
    try {
      const response = await fetch("/api/admin/partners", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status }) });
      const data = await response.json() as { partner?: Partner; error?: string };
      if (!response.ok || !data.partner) throw new Error(data.error ?? "Statusen kunde inte uppdateras.");
      setPartners((current) => current.map((partner) => partner.id === id ? data.partner! : partner));
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Statusen kunde inte uppdateras.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function signOut() {
    await fetch("/api/admin/session", { method: "DELETE" });
    window.location.assign("/admin/login");
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="brand admin-brand" href="/"><span className="brand-mark"><Zap size={18} /></span><span>Elektrikerakut<span>.nu</span></span></Link>
        <nav aria-label="Adminnavigering">
          <Link className="active" href="/admin"><Building2 size={18} /> Partners</Link>
          <Link href="/"><ArrowLeft size={18} /> Kundsidan</Link>
        </nav>
        <div className="admin-user"><span><UserRound size={17} /></span><div><small>Inloggad som</small><strong>{displayName}</strong></div><button type="button" aria-label="Logga ut" onClick={signOut}><LogOut size={16} /></button></div>
      </aside>

      <section className="admin-content">
        <header className="admin-topbar">
          <div><p>Partnernätverk</p><h1>Partnerregister</h1></div>
          <button className="admin-primary" type="button" onClick={() => setShowCreate(true)}><Plus size={18} /> Registrera partner</button>
        </header>

        <div className="admin-stats">
          <article><span><Building2 size={19} /></span><small>Totalt</small><strong>{counts.all}</strong></article>
          <article><span className="amber"><Clock3 size={19} /></span><small>Att granska</small><strong>{counts.pending}</strong></article>
          <article><span className="green"><BadgeCheck size={19} /></span><small>Aktiva</small><strong>{counts.active}</strong></article>
          <article><span className="slate"><Pause size={19} /></span><small>Pausade</small><strong>{counts.paused}</strong></article>
        </div>

        <div className="admin-toolbar">
          <label><Search size={17} /><input aria-label="Sök partner" placeholder="Sök företag, org.nr eller område" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="admin-filter-wrap"><select aria-label="Filtrera status" value={filter} onChange={(event) => setFilter(event.target.value as "ALL" | Status)}><option value="ALL">Alla statusar</option><option value="PENDING">Att granska</option><option value="ACTIVE">Aktiva</option><option value="PAUSED">Pausade</option><option value="REJECTED">Avslagna</option></select><ChevronDown size={16} /></div>
        </div>

        {error && <p className="admin-alert" role="alert">{error}<button type="button" aria-label="Stäng felmeddelande" onClick={() => setError("")}><X size={16} /></button></p>}

        <div className="partner-table-card">
          {loading ? <div className="admin-empty"><span className="admin-spinner" /> Hämtar partnerregister…</div> : filtered.length === 0 ? (
            <div className="admin-empty"><Building2 size={31} /><h2>Inga partners här ännu</h2><p>Registrera ett företag eller invänta den första partneransökan.</p><button className="admin-primary" type="button" onClick={() => setShowCreate(true)}><Plus size={17} /> Registrera partner</button></div>
          ) : (
            <div className="partner-table-scroll"><table><thead><tr><th>Företag</th><th>Område och tjänster</th><th>Kontakt</th><th>Status</th><th>Åtgärd</th></tr></thead><tbody>{filtered.map((partner) => (
              <tr key={partner.id}>
                <td><div className="company-cell"><span>{partner.legalName.slice(0, 2).toUpperCase()}</span><div><strong>{partner.legalName}</strong><small>{partner.organizationNumber} · {partner.publicId}</small>{partner.website && <a href={partner.website} target="_blank" rel="noreferrer">Webbplats <ExternalLink size={11} /></a>}</div></div></td>
                <td><div className="area-cell"><span><MapPin size={14} />{partner.serviceAreas}</span><small>{partner.capabilities.slice(0, 2).join(" · ")}{partner.capabilities.length > 2 ? ` +${partner.capabilities.length - 2}` : ""}</small></div></td>
                <td><div className="contact-cell"><strong>{partner.contactName}</strong><a href={`mailto:${partner.email}`}><Mail size={13} />{partner.email}</a><a href={`tel:${partner.phone}`}><Phone size={13} />{partner.phone}</a></div></td>
                <td><span className={`status-badge ${partner.status.toLowerCase()}`}>{partner.status === "ACTIVE" && <BadgeCheck size={13} />}{statusLabels[partner.status]}</span>{partner.registrationVerifiedAt && <small className="verified-date">Kontrollerad {new Intl.DateTimeFormat("sv-SE").format(new Date(partner.registrationVerifiedAt))}</small>}</td>
                <td><div className="row-actions">{partner.status !== "ACTIVE" && <button className="approve" type="button" disabled={updatingId === partner.id} onClick={() => setStatus(partner.id, "ACTIVE")}><ShieldCheck size={15} /> Verifiera & aktivera</button>}{partner.status === "ACTIVE" && <button type="button" disabled={updatingId === partner.id} onClick={() => setStatus(partner.id, "PAUSED")}><Pause size={15} /> Pausa</button>}{partner.status !== "REJECTED" && partner.status !== "ACTIVE" && <button className="reject" type="button" disabled={updatingId === partner.id} onClick={() => setStatus(partner.id, "REJECTED")}><X size={15} /> Avslå</button>}</div></td>
              </tr>
            ))}</tbody></table></div>
          )}
        </div>
      </section>

      {showCreate && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCreate(false); }}>
          <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="create-partner-title">
            <header><div><p>Ny partner</p><h2 id="create-partner-title">Registrera företag</h2></div><button type="button" aria-label="Stäng" onClick={() => setShowCreate(false)}><X size={20} /></button></header>
            <form onSubmit={createPartner}>
              <div className="partner-field-grid">
                <label className="wide"><span>Juridiskt företagsnamn *</span><input required value={draft.legalName} onChange={(e) => field("legalName", e.target.value)} /></label>
                <label><span>Organisationsnummer *</span><input required value={draft.organizationNumber} onChange={(e) => field("organizationNumber", e.target.value)} /></label>
                <label><span>Webbplats</span><input type="url" value={draft.website} onChange={(e) => field("website", e.target.value)} /></label>
                <label><span>Kontaktperson *</span><input required value={draft.contactName} onChange={(e) => field("contactName", e.target.value)} /></label>
                <label><span>Telefon *</span><input required value={draft.phone} onChange={(e) => field("phone", e.target.value)} /></label>
                <label className="wide"><span>E-post *</span><input required type="email" value={draft.email} onChange={(e) => field("email", e.target.value)} /></label>
              </div>
              <label className="standalone-label"><span>Serviceområde *</span><textarea required rows={2} value={draft.serviceAreas} onChange={(e) => field("serviceAreas", e.target.value)} /></label>
              <fieldset className="capability-fieldset"><legend>Tjänster *</legend><div className="capability-grid">{capabilities.map((option) => { const selected = draft.capabilities.includes(option); return <button type="button" aria-pressed={selected} className={selected ? "selected" : ""} key={option} onClick={() => toggleCapability(option)}><span>{selected && <Check size={13} />}</span>{option}</button>; })}</div></fieldset>
              <label className="standalone-label"><span>Öppettider och kapacitet *</span><textarea required rows={2} value={draft.availability} onChange={(e) => field("availability", e.target.value)} /></label>
              <label className="standalone-label"><span>Intern notering</span><textarea rows={2} value={draft.notes} onChange={(e) => field("notes", e.target.value)} /></label>
              <footer><button className="secondary-button" type="button" onClick={() => setShowCreate(false)}>Avbryt</button><button className="admin-primary" type="submit" disabled={saving}>{saving ? "Sparar…" : "Registrera partner"}<Plus size={17} /></button></footer>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
