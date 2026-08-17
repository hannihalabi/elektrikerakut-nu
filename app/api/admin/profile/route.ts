import { put, del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { adminProfiles } from "../../../../db/schema";
import { getPartnerAdmin } from "../../../partner-admin-auth";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function errorResponse(message: string, status: number) { return Response.json({ error: message }, { status }); }

export async function GET() {
  const admin = await getPartnerAdmin();
  if (!admin) return errorResponse("Åtkomst nekad.", 403);
  const [profile] = await getDb().select().from(adminProfiles).where(eq(adminProfiles.email, admin.email)).limit(1);
  return Response.json({ profile: { photoUrl: profile?.photoUrl ?? null, firstName: profile?.firstName ?? "", lastName: profile?.lastName ?? "" } });
}

export async function PATCH(request: Request) {
  const admin = await getPartnerAdmin();
  if (!admin) return errorResponse("Åtkomst nekad.", 403);
  try {
    const payload = await request.json() as { firstName?: unknown; lastName?: unknown };
    const firstName = typeof payload.firstName === "string" ? payload.firstName.trim().slice(0, 60) : "";
    const lastName = typeof payload.lastName === "string" ? payload.lastName.trim().slice(0, 60) : "";
    if (!firstName || !lastName) return errorResponse("Fyll i både förnamn och efternamn.", 400);
    const [profile] = await getDb().insert(adminProfiles).values({ email: admin.email, firstName, lastName }).onConflictDoUpdate({ target: adminProfiles.email, set: { firstName, lastName, updatedAt: new Date() } }).returning();
    return Response.json({ profile: { photoUrl: profile.photoUrl ?? null, firstName: profile.firstName ?? "", lastName: profile.lastName ?? "" } });
  } catch {
    return errorResponse("Namnet kunde inte sparas.", 500);
  }
}

export async function POST(request: Request) {
  const admin = await getPartnerAdmin();
  if (!admin) return errorResponse("Åtkomst nekad.", 403);
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return errorResponse("Välj ett foto och försök igen.", 400);
    if (!ALLOWED_TYPES.has(file.type)) return errorResponse("Fotot måste vara PNG, JPG eller WebP.", 415);
    if (file.size > MAX_PHOTO_BYTES) return errorResponse("Fotot får vara högst 2 MB.", 413);
    const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const db = getDb();
    const [previous] = await db.select({ photoUrl: adminProfiles.photoUrl }).from(adminProfiles).where(eq(adminProfiles.email, admin.email)).limit(1);
    const blob = await put(`admin-profiles/${encodeURIComponent(admin.email)}.${extension}`, file, { access: "public", addRandomSuffix: true, contentType: file.type });
    await db.insert(adminProfiles).values({ email: admin.email, photoUrl: blob.url }).onConflictDoUpdate({ target: adminProfiles.email, set: { photoUrl: blob.url, updatedAt: new Date() } });
    if (previous?.photoUrl && previous.photoUrl !== blob.url) await del(previous.photoUrl);
    return Response.json({ profile: { photoUrl: blob.url } });
  } catch {
    return errorResponse("Fotot kunde inte laddas upp.", 500);
  }
}
