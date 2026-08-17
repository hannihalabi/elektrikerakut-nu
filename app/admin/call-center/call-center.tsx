"use client";

import { ArrowLeft, BarChart3, Building2, Check, ChevronLeft, ChevronRight, Clock3, FileText, LogOut, MapPin, Network, Phone, PhoneCall, X, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { ProfilePhotoCropper } from "../profile-photo-cropper";
import { ProfileSettings } from "../profile-settings";

type Status = "NEW" | "CALLED" | "BOOKED" | "CLOSED" | "NO_ANSWER";
type RequestRow = {
  id: number;
  publicId: string;
  issue: string;
  postcode: string;
  phone: string;
  suggestedPartnerId: number | null;
  assignedPartnerId: number | null;
  status: Status;
  calledAt: string | null;
  claimedAt: string | null;
  claimedByEmail: string | null;
  claimedByName: string | null;
  claimedByPhotoUrl: string | null;
  bookedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  suggestedPartner: { id: number; legalName: string } | null;
  assignedPartner: { id: number; legalName: string } | null;
};
type PartnerOption = { id: number; legalName: string };

const issueLabels: Record<string, string> = {
  power: "Helt eller delvis strömlöst",
  breaker: "Säkring eller jordfelsbrytare",
  outlet: "Uttag eller elcentral",
  risk: "Lukt, ljud eller annan risk",
  other: "Annat elproblem",
};
const statusLabels: Record<Status, string> = { NEW: "Ny", CALLED: "Ringd", BOOKED: "Bokad", CLOSED: "Avslutad", NO_ANSWER: "Inget svar" };

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

export function CallCenter({ displayName }: { displayName: string }) {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [tab, setTab] = useState<"active" | "history">("active");
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [profileName, setProfileName] = useState(displayName);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [newRequestIds, setNewRequestIds] = useState<Set<number>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundEnabledRef = useRef(false);
  const knownRequestIdsRef = useRef<Set<number> | null>(null);

  useEffect(() => {
    void fetch("/api/admin/profile", { cache: "no-store" }).then((response) => response.json()).then((data: { profile?: { photoUrl?: string | null } }) => setProfileUrl(data.profile?.photoUrl ?? null)).catch(() => undefined);
  }, []);

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


  function playNotification() {
    const context = audioContextRef.current;
    if (!soundEnabledRef.current || !context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(660, context.currentTime + 0.16);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.24);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.25);
  }

  async function enableSound() {
    const context = audioContextRef.current ?? new AudioContext();
    audioContextRef.current = context;
    await context.resume();
    soundEnabledRef.current = true;
    setSoundEnabled(true);
    playNotification();
  }

  async function loadRequests() {
    try {
      const response = await fetch("/api/admin/requests", { cache: "no-store" });
      const data = await response.json().catch(() => ({})) as { requests?: RequestRow[]; partners?: PartnerOption[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Förfrågningarna kunde inte hämtas.");
      const nextRequests = data.requests ?? [];
      const previousIds = knownRequestIdsRef.current;
      const incomingIds = previousIds ? nextRequests.filter((request) => !previousIds.has(request.id)).map((request) => request.id) : [];
      if (previousIds && incomingIds.length > 0) {
        setNewRequestIds(new Set(incomingIds));
        window.setTimeout(() => setNewRequestIds(new Set()), 5000);
        playNotification();
      }
      knownRequestIdsRef.current = new Set(nextRequests.map((request) => request.id));
      setRequests(nextRequests);
      setPartners(data.partners ?? []);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Förfrågningarna kunde inte hämtas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadRequests(), 0);
    const refresh = window.setInterval(() => void loadRequests(), 2000);
    const ticker = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(refresh);
      window.clearInterval(ticker);
    };
  }, []);

  const activeRequests = useMemo(() => requests.filter((request) => request.status !== "CLOSED"), [requests]);
  const historyRequests = useMemo(() => requests.filter((request) => request.status === "CLOSED"), [requests]);
  const visibleRequests = tab === "active" ? activeRequests : historyRequests;
  const counts = useMemo(() => ({
    total: activeRequests.length,
    new: activeRequests.filter((request) => request.status === "NEW").length,
    booked: requests.filter((request) => request.status === "BOOKED").length,
  }), [activeRequests, requests]);

  async function updateRequest(id: number, changes: { status?: Status; assignedPartnerId?: number | null }) {
    const current = requests.find((request) => request.id === id);
    if (!current) return;
    if (changes.status === "BOOKED" && !(changes.assignedPartnerId ?? current.assignedPartnerId)) {
      setError("Välj leverantör innan ärendet bokas.");
      return;
    }
    setUpdatingId(id);
    setError("");
    try {
      const response = await fetch("/api/admin/requests", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, status: changes.status ?? current.status, assignedPartnerId: changes.assignedPartnerId === undefined ? current.assignedPartnerId : changes.assignedPartnerId }),
      });
      const data = await response.json() as { request?: RequestRow; error?: string };
      if (!response.ok || !data.request) throw new Error(data.error ?? "Förfrågan kunde inte uppdateras.");
      setRequests((currentRequests) => currentRequests.map((item) => item.id === id ? data.request! : item));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Förfrågan kunde inte uppdateras.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function signOut() {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <main className={`admin-shell${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
      <aside className="admin-sidebar">
        <button className="admin-sidebar-toggle" type="button" onClick={toggleSidebar} aria-label={sidebarCollapsed ? "Expandera sidomeny" : "Minimera sidomeny"} title={sidebarCollapsed ? "Expandera meny" : "Minimera meny"}>{sidebarCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}</button>
        <Link className="brand admin-brand" href="/"><span className="brand-mark"><Zap size={18} /></span><span>Elektrikerakut<span>.nu</span></span></Link>
        <nav aria-label="Adminnavigering">
          <Link href="/admin"><Building2 size={18} /> Partners</Link>
          <Link className="active" href="/admin/call-center"><PhoneCall size={18} /> Call center</Link>
          <Link href="/admin/statistik"><BarChart3 size={18} /> Statistik</Link>
          <Link href="/admin/seo"><Network size={18} /> URL-karta</Link>
          <Link href="/admin/serps"><FileText size={18} /> SERPS</Link>
          <Link href="/"><ArrowLeft size={18} /> Kundsidan</Link>
        </nav>
        <div className="admin-user"><ProfilePhotoCropper displayName={profileName} profileUrl={profileUrl} onUploaded={setProfileUrl} onError={setError} /><div><small>Inloggad som</small><ProfileSettings email={displayName} onNameChange={setProfileName} /></div><button type="button" aria-label="Logga ut" onClick={signOut}><LogOut size={16} /></button></div>
      </aside>

      <section className="admin-content">
        <header className="admin-topbar">
          <div><p>Inkommande förfrågningar</p><h1>Call center</h1></div>
          <div className="call-center-tools"><button className={`sound-toggle${soundEnabled ? " enabled" : ""}`} type="button" onClick={() => void enableSound()} aria-pressed={soundEnabled}><span>{soundEnabled ? "●" : "○"}</span> {soundEnabled ? "Ljudnotiser aktiva" : "Aktivera ljudnotiser"}</button><span className="call-center-live"><span /> Live – uppdateras var 2:e sekund</span></div>
        </header>

        <div className="admin-stats">
          <article><span><PhoneCall size={19} /></span><small>Aktiva ärenden</small><strong>{counts.total}</strong></article>
          <article><span className="amber"><Clock3 size={19} /></span><small>Behöver ringas</small><strong>{counts.new}</strong></article>
          <article><span className="green"><Check size={19} /></span><small>Bokade</small><strong>{counts.booked}</strong></article>
        </div>

        <div className="call-center-tabs" role="tablist" aria-label="Förfrågningar">
          <button className={tab === "active" ? "active" : ""} type="button" role="tab" aria-selected={tab === "active"} onClick={() => setTab("active")}><PhoneCall size={15} /> Aktiva nu <strong>{activeRequests.length}</strong></button>
          <button className={tab === "history" ? "active" : ""} type="button" role="tab" aria-selected={tab === "history"} onClick={() => setTab("history")}><Clock3 size={15} /> Tidigare ärenden <strong>{historyRequests.length}</strong></button>
        </div>

        {error && <p className="admin-alert" role="alert">{error}<button type="button" aria-label="Stäng felmeddelande" onClick={() => setError("")}><X size={16} /></button></p>}

        <div className="call-center-list">
          {loading ? <div className="admin-empty"><span className="admin-spinner" /> Hämtar förfrågningar…</div> : visibleRequests.length === 0 ? (
            <div className="admin-empty"><PhoneCall size={31} /><h2>{tab === "active" ? "Inga aktiva förfrågningar" : "Ingen historik ännu"}</h2><p>{tab === "active" ? "Nya kundförfrågningar visas här direkt när formuläret skickas in." : "Avslutade ärenden sparas här för uppföljning och statistik."}</p></div>
          ) : <div className="call-center-table-card"><div className="call-center-table-scroll"><div className="call-center-table-head"><span>Ärende och status</span><span>Kontakt</span><span>{tab === "active" ? "Tid att ringa" : "Avslutad"}</span><span>Leverantör</span><span>Åtgärd</span></div>{visibleRequests.map((request) => {
            const createdAt = new Date(request.createdAt).getTime();
            const ageSeconds = Math.max(0, Math.floor((now - createdAt) / 1000));
            const calledElapsed = request.calledAt ? Math.max(0, Math.floor((new Date(request.calledAt).getTime() - createdAt) / 1000)) : null;
            const isCalled = calledElapsed !== null;
            const isLate = isCalled ? calledElapsed > 120 : ageSeconds > 120;
            const timerSeconds = isCalled ? (isLate ? calledElapsed - 120 : 120 - calledElapsed) : (isLate ? ageSeconds - 120 : 120 - ageSeconds);
            const timerLabel = isCalled ? (isLate ? "Ringd för sent" : "Ringd i tid") : (isLate ? "Ring omgående" : "Tid att ringa");
            const timerClass = isLate ? (isCalled ? " called-late" : " expired") : (isCalled ? " called-on-time" : "");
            const overdue = isLate && !isCalled;
            const effectiveClaimer = request.claimedByName ?? (request.status !== "NEW" ? displayName : null);
            const effectiveClaimerPhoto = request.claimedByPhotoUrl ?? (request.status !== "NEW" ? profileUrl : null);
            return (
              <article className={`call-request-card call-center-table-row${overdue ? " overdue" : ""}${request.status === "NEW" ? " awaiting-call" : ""}${newRequestIds.has(request.id) ? " new-request" : ""}`} data-can-book={request.assignedPartnerId ? "true" : "false"} style={{ "--claimer-photo": effectiveClaimerPhoto ? `url(${effectiveClaimerPhoto})` : "none", "--claimer-opacity": effectiveClaimerPhoto ? "1" : "0", "--claimer-name": effectiveClaimer ?? "" } as CSSProperties} key={request.id}>
                <div className="call-request-main"><div className="call-request-identity"><span className="request-kicker">{request.publicId} · {new Intl.DateTimeFormat("sv-SE", { dateStyle: "short", timeStyle: "short" }).format(new Date(request.createdAt))}</span><strong>{issueLabels[request.issue] ?? request.issue}</strong><span className={`request-status ${request.status.toLowerCase()}`}>{statusLabels[request.status]}</span></div><div className="request-contact"><strong><Phone size={15} />{request.phone}</strong><small><MapPin size={13} /> {request.postcode}</small></div>{tab === "active" ? <div className={`request-timer${timerClass}`}><Clock3 size={16} /><span><small>{timerLabel}</small><strong>{isLate ? "+" : ""}{formatTimer(timerSeconds)}</strong></span></div> : <div className="request-history-time"><Clock3 size={16} /><span><small>Avslutad</small><strong>{request.closedAt ? new Intl.DateTimeFormat("sv-SE", { dateStyle: "short", timeStyle: "short" }).format(new Date(request.closedAt)) : "–"}</strong></span></div>}{tab === "active" ? <label className="request-assignment"><span>Leverantör</span><select value={request.assignedPartnerId ?? ""} onChange={(event) => void updateRequest(request.id, { assignedPartnerId: event.target.value ? Number(event.target.value) : null })} disabled={updatingId === request.id}><option value="">Välj leverantör</option>{partners.map((partner) => <option value={partner.id} key={partner.id}>{partner.legalName}</option>)}</select></label> : <div className="request-history-partner"><span>Leverantör</span><strong>{request.assignedPartner?.legalName ?? request.suggestedPartner?.legalName ?? "Ej tilldelad"}</strong></div>}<div className="call-request-actions">{tab === "active" ? <>{<a className={`call-button${request.status !== "NEW" ? " called-button" : ""}`} href={`tel:${request.phone}`} aria-label={`${request.status === "NEW" ? "Ring" : "Ringd"} ${request.phone}`} onClick={() => { if (request.status === "NEW") void updateRequest(request.id, { status: "CALLED" }); }}>{request.status === "NEW" ? <PhoneCall size={15} /> : <Check size={15} />} {request.status === "NEW" ? "Ring" : "Ringd"}</a>}{request.status !== "BOOKED" && request.status !== "CLOSED" && <button className="book-button" type="button" onClick={() => void updateRequest(request.id, { status: "BOOKED" })} disabled={updatingId === request.id}><Check size={15} /> Boka</button>}{request.status === "BOOKED" && <button type="button" onClick={() => void updateRequest(request.id, { status: "CLOSED" })} disabled={updatingId === request.id}><X size={15} /> Avsluta</button>}</> : <span className="archived-note"><Check size={14} /> Ärende avslutat</span>}</div></div>
              </article>
            );
          })}</div></div>}
        </div>
      </section>
    </main>
  );
}
