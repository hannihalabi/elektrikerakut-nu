import { getDb } from "../../../db";
import { partners } from "../../../db/schema";

const CAPABILITIES = new Set(["Akut felsökning", "Strömlöst", "Elcentral och säkringar", "Uttag och installation", "Företag och fastighet"]);

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function normalizeOrganizationNumber(value: unknown) {
  return text(value, 20).replace(/\D/g, "");
}

function parsePayload(payload: Record<string, unknown>) {
  const capabilities = Array.isArray(payload.capabilities)
    ? payload.capabilities.filter((item): item is string => typeof item === "string" && CAPABILITIES.has(item))
    : [];
  const website = text(payload.website, 180);
  const startedAt = Number(payload.startedAt);

  const result = {
    legalName: text(payload.legalName, 120),
    organizationNumber: normalizeOrganizationNumber(payload.organizationNumber),
    contactName: text(payload.contactName, 100),
    email: text(payload.email, 160).toLowerCase(),
    phone: text(payload.phone, 40),
    website,
    serviceAreas: text(payload.serviceAreas, 350),
    capabilities,
    availability: text(payload.availability, 300),
    notes: text(payload.notes, 1000),
    accepted: payload.accepted === true,
    honeypot: text(payload.companyWebsite, 120),
    startedAt,
  };

  const errors: string[] = [];
  if (!result.legalName) errors.push("Företagsnamn saknas.");
  if (!/^\d{10}$/.test(result.organizationNumber)) errors.push("Organisationsnumret ska innehålla tio siffror.");
  if (!result.contactName) errors.push("Kontaktperson saknas.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) errors.push("E-postadressen är ogiltig.");
  if (result.phone.replace(/\D/g, "").length < 7) errors.push("Telefonnumret är ogiltigt.");
  if (!result.serviceAreas) errors.push("Serviceområde saknas.");
  if (!result.capabilities.length) errors.push("Välj minst en tjänst.");
  if (!result.availability) errors.push("Tillgänglighet saknas.");
  if (!result.accepted) errors.push("Bekräfta partnerinformationen.");
  if (website) {
    try {
      const url = new URL(website);
      if (!['http:', 'https:'].includes(url.protocol)) errors.push("Webbadressen är ogiltig.");
    } catch {
      errors.push("Webbadressen är ogiltig.");
    }
  }

  return { result, errors };
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 20_000) return Response.json({ error: "Förfrågan är för stor." }, { status: 413 });
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Ogiltigt format." }, { status: 415 });
  }

  try {
    const payload = await request.json() as Record<string, unknown>;
    const { result, errors } = parsePayload(payload);

    if (result.honeypot) return Response.json({ ok: true, reference: "MOTTAGEN" }, { status: 201 });
    if (!Number.isFinite(result.startedAt) || Date.now() - result.startedAt < 1500) {
      return Response.json({ error: "Formuläret skickades för snabbt. Försök igen." }, { status: 400 });
    }
    if (errors.length) return Response.json({ error: errors[0], errors }, { status: 400 });

    const now = new Date();
    const publicId = `P-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const db = getDb();
    await db.insert(partners).values({
      publicId,
      legalName: result.legalName,
      organizationNumber: result.organizationNumber,
      contactName: result.contactName,
      email: result.email,
      phone: result.phone,
      website: result.website || null,
      serviceAreas: result.serviceAreas,
      capabilities: result.capabilities,
      availability: result.availability,
      notes: result.notes || null,
      source: "SELF_SERVICE",
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    });

    return Response.json({ ok: true, reference: publicId }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("duplicate key value") || message.includes("unique constraint")) {
      return Response.json({ error: "Det finns redan en partneransökan för organisationsnumret." }, { status: 409 });
    }
    return Response.json({ error: "Ansökan kunde inte sparas. Försök igen senare." }, { status: 500 });
  }
}
