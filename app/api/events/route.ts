import { getDb } from "../../../db";
import { siteEvents } from "../../../db/schema";

const EVENT_TYPES = new Set(["PAGE_VIEW", "CTA_CLICK", "FORM_ERROR", "REQUEST_SUBMITTED", "MATCH_STARTED", "MATCH_FOUND", "MATCH_NOT_FOUND", "COVERAGE_UNAVAILABLE"]);

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Ogiltigt format." }, { status: 415 });
  }

  try {
    const payload = await request.json() as Record<string, unknown>;
    const eventType = text(payload.eventType, 20);
    const path = text(payload.path, 120) || "/";
    if (!EVENT_TYPES.has(eventType)) return Response.json({ error: "Ogiltig händelse." }, { status: 400 });

    await getDb().insert(siteEvents).values({
      eventType: eventType as "PAGE_VIEW" | "CTA_CLICK" | "FORM_ERROR" | "REQUEST_SUBMITTED" | "MATCH_STARTED" | "MATCH_FOUND" | "MATCH_NOT_FOUND" | "COVERAGE_UNAVAILABLE",
      path,
      createdAt: new Date(),
    });
    return Response.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Statistiken kunde inte sparas." }, { status: 500 });
  }
}
