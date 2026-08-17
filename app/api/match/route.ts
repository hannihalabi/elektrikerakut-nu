import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { partners, serviceRequests } from "../../../db/schema";

const ISSUE_CAPABILITIES: Record<string, string> = {
  power: "Strömlöst",
  breaker: "Elcentral och säkringar",
  outlet: "Uttag och installation",
  risk: "Akut felsökning",
  other: "Akut felsökning",
};

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function areaScore(serviceAreas: string, postcode: string) {
  const areas = serviceAreas.toLocaleLowerCase("sv-SE");
  const compactAreas = areas.replace(/\s/g, "");
  const prefix = postcode.slice(0, 3);

  if (compactAreas.includes(postcode) || compactAreas.includes(prefix)) return 4;
  if (/(stockholm|storstockholm|stockholms län|hela sverige|hela landet)/i.test(areas)) return 3;
  return 0;
}

function capabilityScore(capabilities: string[], required: string) {
  if (capabilities.includes(required)) return 3;
  return capabilities.includes("Akut felsökning") ? 1 : 0;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as Record<string, unknown>;
    const issue = text(payload.issue, 20);
    const details = text(payload.details, 500);
    const postcode = text(payload.postcode, 5).replace(/\D/g, "");
    const phone = text(payload.phone, 40);
    const requestId = Number(payload.requestId);
    const requiredCapability = ISSUE_CAPABILITIES[issue];

    if (!requiredCapability || !/^\d{5}$/.test(postcode) || phone.replace(/\D/g, "").length < 7) {
      return Response.json({ error: "Ogiltig matchningsförfrågan." }, { status: 400 });
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(partners)
      .where(eq(partners.status, "ACTIVE"))
      .orderBy(desc(partners.updatedAt))
      .limit(100);

    const candidates = rows
      .map((partner) => ({
        partner,
        area: areaScore(partner.serviceAreas, postcode),
        capability: capabilityScore(partner.capabilities, requiredCapability),
      }))
      .filter((candidate) => candidate.area > 0 && candidate.capability > 0)
      .sort((left, right) => (right.area + right.capability) - (left.area + left.capability));

    const selected = candidates[0]?.partner;
    if (Number.isInteger(requestId) && requestId > 0) {
      await db.update(serviceRequests).set({ suggestedPartnerId: selected?.id ?? null, updatedAt: new Date() }).where(eq(serviceRequests.id, requestId));
    } else {
      await db.insert(serviceRequests).values({
        publicId: `R-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        issue,
        details: details || null,
        postcode,
        phone,
        suggestedPartnerId: selected?.id ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    return Response.json({
      match: selected ? {
        publicId: selected.publicId,
        legalName: selected.legalName,
        logoUrl: selected.logoUrl,
        phone: selected.phone,
        website: selected.website,
        serviceAreas: selected.serviceAreas,
        availability: selected.availability,
      } : null,
      candidateCount: candidates.length,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Matchningen kunde inte genomföras." }, { status: 500 });
  }
}
