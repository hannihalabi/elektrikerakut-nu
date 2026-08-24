"use client";

import { Check, Clipboard, Printer } from "lucide-react";
import { useMemo, useState } from "react";

const checklistItems = [
  "Bränd lukt, rök eller gnistor",
  "Varmt, missfärgat eller sprucket uttag",
  "Surr, knaster eller ovanligt ljud från elcentral",
  "Säkring eller jordfelsbrytare löser ut igen",
  "Skadad kabel, stickpropp eller laddare",
  "Fukt eller vatten nära elutrustning",
  "Otydlig gruppförteckning vid återkommande fel",
  "Barn, äldre eller husdjur nära det berörda området",
];

const embedCode = `<a href="https://elektrikerakut.nu/guider/checklista-elfel-hemma" style="display:block;border:1px solid #d8e3f0;border-radius:10px;padding:14px 16px;color:#173b66;text-decoration:none;font-family:Arial,sans-serif;max-width:520px;">
  <strong>Checklista vid elfel hemma</strong>
  <span style="display:block;margin-top:6px;color:#5b6f88;font-size:14px;line-height:1.5;">Kontrollera bränd lukt, varma uttag, säkringar och andra varningssignaler utan att ta onödiga risker.</span>
  <span style="display:block;margin-top:10px;color:#1668e8;font-size:13px;font-weight:700;">Läs checklistan hos Elektrikerakut.nu</span>
</a>`;

export function ChecklistResourceTools() {
  const [copied, setCopied] = useState<"checklist" | "embed" | null>(null);
  const plainText = useMemo(() => checklistItems.map((item) => `- ${item}`).join("\n"), []);

  async function copyEmbedCode() {
    await navigator.clipboard.writeText(embedCode);
    setCopied("embed");
    window.setTimeout(() => setCopied(null), 2200);
  }

  async function copyChecklist() {
    await navigator.clipboard.writeText(`Checklista vid elfel hemma\n${plainText}`);
    setCopied("checklist");
    window.setTimeout(() => setCopied(null), 2200);
  }

  return (
    <section className="guide-resource-kit" aria-labelledby="guide-resource-kit-title">
      <div className="guide-resource-heading">
        <span>Länkbar resurs</span>
        <h2 id="guide-resource-kit-title">Utskriftsvänlig checklista</h2>
        <p>En kompakt version som kan sparas, skrivas ut eller delas vidare med tydlig källa.</p>
      </div>

      <div className="guide-print-resource" aria-label="Checklista vid elfel hemma">
        <header>
          <strong>Checklista vid elfel hemma</strong>
          <span>Elektrikerakut.nu</span>
        </header>
        <ul>
          {checklistItems.map((item) => (
            <li key={item}>
              <label>
                <input type="checkbox" />
                <span>{item}</span>
              </label>
            </li>
          ))}
        </ul>
        <p>Vid rök, brand, personskada eller ström genom kroppen: ring 112.</p>
      </div>

      <div className="guide-print-actions">
        <button type="button" onClick={() => window.print()}>
          <Printer size={16} /> Skriv ut checklistan
        </button>
        <button type="button" onClick={copyChecklist}>
          {copied === "checklist" ? <Check size={16} /> : <Clipboard size={16} />} Kopiera checklistan
        </button>
      </div>

      <div className="guide-embed-panel">
        <div>
          <strong>Inbäddningsbar länkbox</strong>
          <p>För BRF-sidor, boendeportaler och guider som vill länka till checklistan.</p>
        </div>
        <textarea readOnly value={embedCode} aria-label="HTML-kod för inbäddningsbar länkbox" />
        <button type="button" onClick={copyEmbedCode}>
          {copied === "embed" ? <Check size={16} /> : <Clipboard size={16} />} Kopiera HTML
        </button>
      </div>
    </section>
  );
}
