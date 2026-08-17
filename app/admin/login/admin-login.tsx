"use client";

import { ArrowLeft, LockKeyhole, LogIn, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Inloggningen misslyckades.");
      router.push("/admin");
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Inloggningen misslyckades.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-login-shell">
      <section className="admin-login-card">
        <Link className="brand admin-login-brand" href="/">
          <span className="brand-mark"><Zap size={19} /></span>
          <span>Elektrikerakut<span>.nu</span></span>
        </Link>
        <div className="admin-login-icon"><LockKeyhole size={27} /></div>
        <p className="loading-kicker">Skyddad administration</p>
        <h1>Logga in till partnerregistret</h1>
        <p>Endast behöriga administratörer har åtkomst.</p>
        <form onSubmit={submit}>
          <label><span>E-postadress</span><input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label><span>Lösenord</span><input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="submit-button" type="submit" disabled={submitting}>{submitting ? "Loggar in…" : "Logga in"}<LogIn size={17} /></button>
        </form>
        <Link className="password-reset-link" href="/admin/aterstall-losenord">Glömt lösenordet?</Link>
        <div className="admin-login-security"><ShieldCheck size={16} /> Säker, tidsbegränsad session</div>
        <Link className="back-link" href="/"><ArrowLeft size={16} /> Till kundsidan</Link>
      </section>
    </main>
  );
}
