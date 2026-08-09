import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { partners } from "../../../../db/schema";
import { getPartnerAdmin } from "../../../partner-admin-auth";

const STATUSES = new Set(["PENDING", "ACTIVE", "PAUSED", "REJECTED"]);
const CAPABILITIES = new Set(["Akut felsökning", "Strömlöst", "Elcentral och säkringar", "Uttag och installation", "Företag och fastighet"]);

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validWebsite(value: string) {
  if (!value) return true;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function publicPartner(row: typeof partners.$inferSelect) {
  return {
    ...row,
    capabilities: JSON.parse(row.capabilities) as string[],
    registrationVerifiedAt: row.registrationVerifiedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET() {
  const admin = await getPartnerAdmin();
  if (!admin) return Response.json({ error: "Åtkomst nekad." }, { status: 403 });

  const rows = await getDb().select().from(partners).orderBy(desc(partners.createdAt)).limit(250);
  return Response.json({ partners: rows.map(publicPartner), user: { name: admin.displayName, email: admin.email } });
}

export async function POST(request: Request) {
  const admin = await getPartnerAdmin();
  if (!admin) return Response.json({ error: "Åtkomst nekad." }, { status: 403 });

  try {
    const payload = await request.json() as Record<string, unknown>;
    const organizationNumber = text(payload.organizationNumber, 20).replace(/\D/g, "");
    const capabilities = Array.isArray(payload.capabilities)
      ? payload.capabilities.filter((item): item is string => typeof item === "string" && CAPABILITIES.has(item))
      : [];
    const legalName = text(payload.legalName, 120);
    const contactName = text(payload.contactName, 100);
    const email = text(payload.email, 160).toLowerCase();
    const phone = text(payload.phone, 40);
    const website = text(payload.website, 180);
    const serviceAreas = text(payload.serviceAreas, 350);
    const availability = text(payload.availability, 300);

    if (!legalName || !contactName || !email || !phone || !serviceAreas || !availability || !capabilities.length || !/^\d{10}$/.test(organizationNumber)) {
      return Response.json({ error: "Kontrollera att alla obligatoriska fält är korrekt ifyllda." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || phone.replace(/\D/g, "").length < 7 || !validWebsite(website)) {
      return Response.json({ error: "Kontrollera e-post, telefon och webbplats." }, { status: 400 });
    }

    const now = new Date();
    const [created] = await getDb().insert(partners).values({
      publicId: `P-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      legalName,
      organizationNumber,
      contactName,
      email,
      phone,
      website: website || null,
      serviceAreas,
      capabilities: JSON.stringify(capabilities),
      availability,
      notes: text(payload.notes, 1000) || null,
      source: "ADMIN",
      status: "PENDING",
      createdBy: admin.email,
      createdAt: now,
      updatedAt: now,
    }).returning();

    return Response.json({ partner: publicPartner(created) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("UNIQUE constraint failed")) return Response.json({ error: "Organisationsnumret finns redan." }, { status: 409 });
    return Response.json({ error: "Partnern kunde inte registreras." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = await getPartnerAdmin();
  if (!admin) return Response.json({ error: "Åtkomst nekad." }, { status: 403 });

  const payload = await request.json() as Record<string, unknown>;
  const id = Number(payload.id);
  const status = text(payload.status, 20);
  if (!Number.isInteger(id) || id <= 0 || !STATUSES.has(status)) {
    return Response.json({ error: "Ogiltig statusuppdatering." }, { status: 400 });
  }

  const now = new Date();
  const [updated] = await getDb().update(partners).set({
    status: status as "PENDING" | "ACTIVE" | "PAUSED" | "REJECTED",
    registrationVerifiedAt: status === "ACTIVE" ? now : undefined,
    updatedAt: now,
  }).where(eq(partners.id, id)).returning();

  if (!updated) return Response.json({ error: "Partnern hittades inte." }, { status: 404 });
  return Response.json({ partner: publicPartner(updated) });
}
