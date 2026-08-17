import { del, put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { partners } from "../../../../../db/schema";
import { getPartnerAdmin } from "../../../../partner-admin-auth";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function jsonError(error: string, status: number) {
  return Response.json({ error }, { status });
}

export async function POST(request: Request) {
  const admin = await getPartnerAdmin();
  if (!admin) return jsonError("Åtkomst nekad.", 403);

  try {
    const formData = await request.formData();
    const id = Number(formData.get("partnerId"));
    const file = formData.get("file");

    if (!Number.isInteger(id) || id <= 0 || !(file instanceof File)) {
      return jsonError("Välj en logotyp och försök igen.", 400);
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return jsonError("Logotypen måste vara PNG, JPG eller WebP.", 415);
    }
    if (file.size > MAX_LOGO_BYTES) {
      return jsonError("Logotypen får vara högst 2 MB.", 413);
    }

    const db = getDb();
    const [partner] = await db.select({ publicId: partners.publicId, logoUrl: partners.logoUrl }).from(partners).where(eq(partners.id, id)).limit(1);
    if (!partner) return jsonError("Partnern hittades inte.", 404);

    const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const blob = await put(`partner-logos/${partner.publicId}.${extension}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });

    try {
      const [updated] = await db.update(partners).set({ logoUrl: blob.url, updatedAt: new Date() }).where(eq(partners.id, id)).returning();
      if (!updated) {
        await del(blob.url);
        return jsonError("Partnern kunde inte uppdateras.", 500);
      }
      if (partner.logoUrl && partner.logoUrl !== blob.url) await del(partner.logoUrl);
      return Response.json({ partner: { ...updated, registrationVerifiedAt: updated.registrationVerifiedAt?.toISOString() ?? null, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() } });
    } catch (error) {
      await del(blob.url);
      throw error;
    }
  } catch {
    return jsonError("Logotypen kunde inte laddas upp.", 500);
  }
}
