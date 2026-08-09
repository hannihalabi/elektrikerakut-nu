import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { partners } from "../../../db/schema";

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
    const postcode = text(payload.postcode, 5).replace(/\D/g, "");
    const requiredCapability = ISSUE_CAPABILITIES[issue];

    if (!requiredCapability || !/^\d{5}$/.test(postcode)) {
      return Response.json({ error: "Ogiltig matchningsförfrågan." }, { status: 400 });
    }

    const rows = await getDb()
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
    return Response.json({
      match: selected ? {
        publicId: selected.publicId,
        legalName: selected.legalName,
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
