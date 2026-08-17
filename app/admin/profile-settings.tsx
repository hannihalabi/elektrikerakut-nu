"use client";

import { Check, Settings, X } from "lucide-react";
import { useEffect, useState } from "react";

export function ProfileSettings({ email, onNameChange }: { email: string; onNameChange: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/admin/profile", { cache: "no-store" }).then((response) => response.json()).then((data: { profile?: { firstName?: string; lastName?: string } }) => { setFirstName(data.profile?.firstName ?? ""); setLastName(data.profile?.lastName ?? ""); }).catch(() => undefined);
  }, []);

  async function save() {
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/admin/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ firstName, lastName }) });
      const data = await response.json().catch(() => ({})) as { profile?: { firstName?: string; lastName?: string }; error?: string };
      if (!response.ok || !data.profile) throw new Error(data.error ?? "Namnet kunde inte sparas.");
      onNameChange(`${data.profile.firstName} ${data.profile.lastName}`);
      setOpen(false);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Namnet kunde inte sparas."); }
    finally { setSaving(false); }
  }

  return <>
    <button className="admin-profile-name" type="button" onClick={() => setOpen(true)} title="Öppna inställningar"><strong>{firstName && lastName ? `${firstName} ${lastName}` : email}</strong><Settings size={12} /></button>
    {open && <div className="profile-settings-backdrop" role="dialog" aria-modal="true" aria-labelledby="profile-settings-title"><div className="profile-settings-modal"><header><div><p>Adminprofil</p><h2 id="profile-settings-title">Inställningar</h2></div><button type="button" aria-label="Stäng" onClick={() => setOpen(false)}><X size={18} /></button></header><div className="profile-settings-form"><label><span>Förnamn</span><input value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" /></label><label><span>Efternamn</span><input value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" /></label>{error && <p className="field-error">{error}</p>}</div><footer><button type="button" onClick={() => setOpen(false)}>Avbryt</button><button className="admin-primary" type="button" onClick={() => void save()} disabled={saving}><Check size={15} /> {saving ? "Sparar…" : "Spara namn"}</button></footer></div></div>}
  </>;
}
