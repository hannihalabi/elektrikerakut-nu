import { and, count, gte, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { siteEvents } from "../../../../db/schema";
import { getPartnerAdmin } from "../../../partner-admin-auth";

async function eventCount(eventType: "PAGE_VIEW" | "MATCH_STARTED" | "MATCH_FOUND", since: Date) {
  const [result] = await getDb().select({ value: count() }).from(siteEvents).where(and(eq(siteEvents.eventType, eventType), gte(siteEvents.createdAt, since)));
  return result?.value ?? 0;
}

export async function GET() {
  const admin = await getPartnerAdmin();
  if (!admin) return Response.json({ error: "Åtkomst nekad." }, { status: 403 });

  const now = Date.now();
  const day = new Date(now - 24 * 60 * 60 * 1000);
  const week = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const month = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const [visitsDay, visitsWeek, visitsMonth, matchesMonth, foundMonth] = await Promise.all([
    eventCount("PAGE_VIEW", day),
    eventCount("PAGE_VIEW", week),
    eventCount("PAGE_VIEW", month),
    eventCount("MATCH_STARTED", month),
    eventCount("MATCH_FOUND", month),
  ]);

  return Response.json({ visitsDay, visitsWeek, visitsMonth, matchesMonth, foundMonth }, { headers: { "Cache-Control": "no-store" } });
}
