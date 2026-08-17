"use client";

import { Check, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = { displayName: string; profileUrl: string | null; uploading?: boolean; onUploaded: (url: string) => void; onError: (message: string) => void };

export function ProfilePhotoCropper({ displayName, profileUrl, uploading = false, onUploaded, onError }: Props) {
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (sourceUrl) URL.revokeObjectURL(sourceUrl); }, [sourceUrl]);

  function selectFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { onError("Välj en bildfil."); return; }
    if (file.size > 2 * 1024 * 1024) { onError("Fotot får vara högst 2 MB."); return; }
    setZoom(1);
    setSourceUrl(URL.createObjectURL(file));
  }

  async function saveCrop() {
    if (!sourceUrl) return;
    try {
      const image = new Image();
      image.src = sourceUrl;
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Bilden kunde inte läsas.")); });
      const side = Math.min(image.naturalWidth, image.naturalHeight) / zoom;
      const sx = (image.naturalWidth - side) / 2;
      const sy = (image.naturalHeight - side) / 2;
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      canvas.getContext("2d")?.drawImage(image, sx, sy, side, side, 0, 0, 512, 512);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      if (!blob) throw new Error("Beskärningen kunde inte skapas.");
      const body = new FormData();
      body.set("file", new File([blob], "profilfoto.jpg", { type: "image/jpeg" }));
      const response = await fetch("/api/admin/profile", { method: "POST", body });
      const data = await response.json().catch(() => ({})) as { profile?: { photoUrl?: string | null }; error?: string };
      if (!response.ok || !data.profile?.photoUrl) throw new Error(data.error ?? "Fotot kunde inte laddas upp.");
      onUploaded(data.profile.photoUrl);
      setSourceUrl(null);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Fotot kunde inte laddas upp.");
    }
  }

  return <>
    <label className={`admin-avatar-upload${uploading ? " is-uploading" : ""}`} title="Klicka för att ladda upp profilfoto">
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" aria-label="Ladda upp profilfoto" disabled={uploading} onChange={(event) => { selectFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
      {profileUrl ? <img src={profileUrl} alt={`Profilfoto för ${displayName}`} /> : <UserRound size={20} />}
    </label>
    {sourceUrl && <div className="photo-crop-backdrop" role="dialog" aria-modal="true" aria-labelledby="photo-crop-title">
      <div className="photo-crop-modal">
        <header><div><p>Profilbild</p><h2 id="photo-crop-title">Beskär foto</h2></div><button type="button" aria-label="Avbryt" onClick={() => setSourceUrl(null)}><X size={19} /></button></header>
        <div className="photo-crop-preview"><img src={sourceUrl} alt="Förhandsvisning av profilfoto" style={{ transform: `scale(${zoom})` }} /></div>
        <label className="photo-crop-zoom"><span>Zoom</span><input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label>
        <footer><button type="button" onClick={() => setSourceUrl(null)}>Avbryt</button><button className="admin-primary" type="button" onClick={() => void saveCrop()}><Check size={16} /> Använd foto</button></footer>
      </div>
    </div>}
  </>;
}
