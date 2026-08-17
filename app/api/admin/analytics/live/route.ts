import { desc, gte } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { siteEvents } from "../../../../../db/schema";
import { getPartnerAdmin } from "../../../../partner-admin-auth";

const ACTIVE_WINDOW_MINUTES = 5;
const FEED_WINDOW_MINUTES = 30;
const FEED_LIMIT = 50;

export async function GET() {
  const admin = await getPartnerAdmin();
  if (!admin) return Response.json({ error: "Åtkomst nekad." }, { status: 403 });

  const now = new Date();
  const feedSince = new Date(now.getTime() - FEED_WINDOW_MINUTES * 60_000);
  const activeSince = new Date(now.getTime() - ACTIVE_WINDOW_MINUTES * 60_000);

  const db = getDb();
  const [recentEvents, activeRows] = await Promise.all([
    db.select({ eventType: siteEvents.eventType, path: siteEvents.path, createdAt: siteEvents.createdAt })
      .from(siteEvents)
      .where(gte(siteEvents.createdAt, feedSince))
      .orderBy(desc(siteEvents.createdAt))
      .limit(FEED_LIMIT),
    db.select({ path: siteEvents.path })
      .from(siteEvents)
      .where(gte(siteEvents.createdAt, activeSince)),
  ]);

  const pathCounts = new Map<string, number>();
  for (const row of activeRows) pathCounts.set(row.path, (pathCounts.get(row.path) ?? 0) + 1);
  const activePaths = [...pathCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8)
    .map(([path, count]) => ({ path, count }));

  return Response.json({
    events: recentEvents.map((event) => ({ eventType: event.eventType, path: event.path, createdAt: event.createdAt.toISOString() })),
    activePaths,
    activeViewCount: activeRows.length,
    windowMinutes: ACTIVE_WINDOW_MINUTES,
    serverTime: now.toISOString(),
  }, { headers: { "Cache-Control": "no-store" } });
}
