import { getDb } from "../../../db";
import { serviceRequests } from "../../../db/schema";

const ISSUE_IDS = new Set(["power", "breaker", "outlet", "risk", "other"]);

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as Record<string, unknown>;
    const issue = text(payload.issue, 20);
    const details = text(payload.details, 500);
    const postcode = text(payload.postcode, 5).replace(/\D/g, "");
    const phone = text(payload.phone, 40);
    const accepted = payload.accepted === true;
    if (!ISSUE_IDS.has(issue) || (issue === "other" && details.length < 5) || !/^\d{5}$/.test(postcode) || phone.replace(/\D/g, "").length < 7 || !accepted) {
      return Response.json({ error: "Ogiltig förfrågan." }, { status: 400 });
    }

    const now = new Date();
    const [created] = await getDb().insert(serviceRequests).values({
      publicId: `R-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      issue,
      details: details || null,
      postcode,
      phone,
      createdAt: now,
      updatedAt: now,
    }).returning({ id: serviceRequests.id, publicId: serviceRequests.publicId });

    return Response.json({ request: created }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[api/requests] failed", error);
    return Response.json({ error: "Förfrågan kunde inte sparas." }, { status: 500 });
  }
}
