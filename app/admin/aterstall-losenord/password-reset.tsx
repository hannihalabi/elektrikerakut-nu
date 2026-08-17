"use client";

import { ArrowLeft, CheckCircle2, KeyRound, Mail, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";

export function PasswordReset() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [mode, setMode] = useState<"request" | "reset" | "done">(token ? "reset" : "request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/password-reset/request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Återställningen kunde inte startas.");
      setMessage(data.message ?? "Kontrollera din e-post.");
      setMode("done");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Återställningen kunde inte startas."); }
    finally { setSubmitting(false); }
  }

  async function confirmReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== passwordAgain) { setError("Lösenorden stämmer inte överens."); return; }
    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/password-reset/confirm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, password }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Lösenordet kunde inte återställas.");
      setMessage("Ditt lösenord är uppdaterat. Du kan nu logga in.");
      setMode("done");
    } catch (resetError) { setError(resetError instanceof Error ? resetError.message : "Lösenordet kunde inte återställas."); }
    finally { setSubmitting(false); }
  }

  return <main className="admin-login-shell"><section className="admin-login-card">
    <Link className="brand admin-login-brand" href="/"><span className="brand-mark"><Zap size={19} /></span><span>Elektrikerakut<span>.nu</span></span></Link>
    <div className="admin-login-icon">{mode === "done" ? <CheckCircle2 size={27} /> : mode === "reset" ? <KeyRound size={27} /> : <Mail size={27} />}</div>
    {mode === "request" && <><p className="loading-kicker">Återställ lösenord</p><h1>Glömt lösenordet?</h1><p>Skriv din administratörs-e-post så skickar vi en säker återställningslänk.</p><form onSubmit={requestReset}><label><span>E-postadress</span><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="submit-button" type="submit" disabled={submitting}>{submitting ? "Skickar…" : "Skicka återställningslänk"}<Mail size={17} /></button></form></>}
    {mode === "reset" && <><p className="loading-kicker">Välj nytt lösenord</p><h1>Skapa ett nytt lösenord</h1><p>Välj minst 12 tecken. Länken kan bara användas en gång.</p><form onSubmit={confirmReset}><label><span>Nytt lösenord</span><input required minLength={12} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><label><span>Upprepa lösenord</span><input required minLength={12} type="password" autoComplete="new-password" value={passwordAgain} onChange={(event) => setPasswordAgain(event.target.value)} /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="submit-button" type="submit" disabled={submitting}>{submitting ? "Sparar…" : "Spara nytt lösenord"}<KeyRound size={17} /></button></form></>}
    {mode === "done" && <><p className="loading-kicker">Klart</p><h1>Kontrollera nästa steg</h1><p>{message}</p><Link className="submit-button reset-login-link" href="/admin/login">Till inloggningen<ArrowLeft size={17} /></Link></>}
    <div className="admin-login-security"><ShieldCheck size={16} /> Säker, tidsbegränsad återställning</div>
    <Link className="back-link" href="/admin/login"><ArrowLeft size={16} /> Till inloggningen</Link>
  </section></main>;
}
