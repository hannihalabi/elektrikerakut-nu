import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../../db";
import { adminProfiles, partners, serviceRequests } from "../../../../db/schema";
import { getPartnerAdmin } from "../../../partner-admin-auth";

const STATUSES = new Set(["NEW", "CALLED", "BOOKED", "CLOSED", "NO_ANSWER"]);

function publicRequest(row: typeof serviceRequests.$inferSelect, partnerNames: Map<number, string>, profilePhotos: Map<string, string>) {
  return {
    ...row,
    suggestedPartner: row.suggestedPartnerId ? { id: row.suggestedPartnerId, legalName: partnerNames.get(row.suggestedPartnerId) ?? "Okänd partner" } : null,
    assignedPartner: row.assignedPartnerId ? { id: row.assignedPartnerId, legalName: partnerNames.get(row.assignedPartnerId) ?? "Okänd partner" } : null,
    calledAt: row.calledAt?.toISOString() ?? null,
    claimedAt: row.claimedAt?.toISOString() ?? null,
    claimedByEmail: row.claimedByEmail,
    claimedByName: row.claimedByName,
    claimedByPhotoUrl: row.claimedByEmail ? profilePhotos.get(row.claimedByEmail) ?? null : null,
    bookedAt: row.bookedAt?.toISOString() ?? null,
    closedAt: row.closedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET() {
  const admin = await getPartnerAdmin();
  if (!admin) return Response.json({ error: "Åtkomst nekad." }, { status: 403 });

  const db = getDb();
  const [requests, activePartners, profiles] = await Promise.all([
    db.select().from(serviceRequests).orderBy(desc(serviceRequests.createdAt)).limit(250),
    db.select({ id: partners.id, legalName: partners.legalName }).from(partners).where(eq(partners.status, "ACTIVE")).orderBy(partners.legalName),
    db.select({ email: adminProfiles.email, photoUrl: adminProfiles.photoUrl }).from(adminProfiles),
  ]);
  const partnerNames = new Map(activePartners.map((partner) => [partner.id, partner.legalName]));
  const profilePhotos = new Map(profiles.flatMap((profile) => profile.photoUrl ? [[profile.email, profile.photoUrl] as const] : []));
  return Response.json({
    requests: requests.map((request) => publicRequest(request, partnerNames, profilePhotos)),
    partners: activePartners,
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  const admin = await getPartnerAdmin();
  if (!admin) return Response.json({ error: "Åtkomst nekad." }, { status: 403 });

  try {
    const payload = await request.json() as { id?: unknown; status?: unknown; assignedPartnerId?: unknown };
    const id = Number(payload.id);
    const status = typeof payload.status === "string" ? payload.status : "";
    const hasAssignedPartner = Object.prototype.hasOwnProperty.call(payload, "assignedPartnerId");
    const assignedPartnerId = !hasAssignedPartner
      ? undefined
      : payload.assignedPartnerId === null || payload.assignedPartnerId === ""
      ? null
      : Number(payload.assignedPartnerId);

    if (!Number.isInteger(id) || id <= 0 || !STATUSES.has(status) || (assignedPartnerId !== null && assignedPartnerId !== undefined && (!Number.isInteger(assignedPartnerId) || assignedPartnerId <= 0))) {
      return Response.json({ error: "Ogiltig uppdatering." }, { status: 400 });
    }

    const db = getDb();
    const [current] = await db.select({ calledAt: serviceRequests.calledAt, bookedAt: serviceRequests.bookedAt, closedAt: serviceRequests.closedAt, claimedAt: serviceRequests.claimedAt }).from(serviceRequests).where(eq(serviceRequests.id, id)).limit(1);
    if (!current) return Response.json({ error: "Förfrågan hittades inte." }, { status: 404 });
    if (assignedPartnerId !== null && assignedPartnerId !== undefined) {
      const [partner] = await db.select({ id: partners.id }).from(partners).where(eq(partners.id, assignedPartnerId)).limit(1);
      if (!partner) return Response.json({ error: "Leverantören hittades inte." }, { status: 404 });
    }
    const now = new Date();
    const [updated] = await db.update(serviceRequests).set({
      status: status as "NEW" | "CALLED" | "BOOKED" | "CLOSED" | "NO_ANSWER",
      ...(hasAssignedPartner ? { assignedPartnerId } : {}),
      ...(status === "CALLED" && !current.calledAt ? { calledAt: now } : {}),
      ...(status === "CALLED" && !current.claimedAt ? { claimedByEmail: admin.email, claimedByName: admin.displayName, claimedAt: now } : {}),
      ...(status === "BOOKED" && !current.bookedAt ? { bookedAt: now } : {}),
      ...(status === "CLOSED" && !current.closedAt ? { closedAt: now } : {}),
      updatedAt: now,
    }).where(eq(serviceRequests.id, id)).returning();
    if (!updated) return Response.json({ error: "Förfrågan hittades inte." }, { status: 404 });

    const activePartners = await db.select({ id: partners.id, legalName: partners.legalName }).from(partners).where(inArray(partners.id, [updated.suggestedPartnerId ?? -1, updated.assignedPartnerId ?? -1]));
    const profiles = await db.select({ email: adminProfiles.email, photoUrl: adminProfiles.photoUrl }).from(adminProfiles);
    const partnerNames = new Map(activePartners.map((partner) => [partner.id, partner.legalName]));
    const profilePhotos = new Map(profiles.flatMap((profile) => profile.photoUrl ? [[profile.email, profile.photoUrl] as const] : []));
    return Response.json({ request: publicRequest(updated, partnerNames, profilePhotos) });
  } catch {
    return Response.json({ error: "Förfrågan kunde inte uppdateras." }, { status: 500 });
  }
}
