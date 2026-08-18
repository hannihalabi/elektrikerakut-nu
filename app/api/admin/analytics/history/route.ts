import { and, desc, gte, sql } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { siteEvents } from "../../../../../db/schema";
import { getPartnerAdmin } from "../../../../partner-admin-auth";
import { getGuidePost } from "../../../../guider/posts";

const RANGE_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
const PATH_LIMIT = 10;

const STATIC_LABELS: Record<string, string> = {
  "/": "Startsida",
  "/eljour": "Eljour – områdeshubb",
  "/guider": "Elguiden – översikt",
  "/trygghet": "Trygg matchning",
  "/bli-partner": "Bli partner",
};

function labelForPath(path: string) {
  if (STATIC_LABELS[path]) return STATIC_LABELS[path];
  const guideMatch = /^\/guider\/([^/]+)$/.exec(path);
  if (guideMatch) return getGuidePost(guideMatch[1])?.title ?? path;
  const areaMatch = /^\/eljour\/([^/]+)$/.exec(path);
  if (areaMatch) return `Eljour ${areaMatch[1]}`;
  return path;
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_EVENT_LIMIT = 500;

export async function GET(request: Request) {
  const admin = await getPartnerAdmin();
  if (!admin) return Response.json({ error: "Åtkomst nekad." }, { status: 403 });

  const url = new URL(request.url);
  const dayParam = url.searchParams.get("day");
  if (dayParam) {
    if (!DAY_RE.test(dayParam)) return Response.json({ error: "Ogiltigt datum." }, { status: 400 });
    const dayStart = new Date(`${dayParam}T00:00:00.000Z`);
    if (Number.isNaN(dayStart.valueOf())) return Response.json({ error: "Ogiltigt datum." }, { status: 400 });
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const rows = await getDb().select({ path: siteEvents.path, createdAt: siteEvents.createdAt })
      .from(siteEvents)
      .where(and(sql`${siteEvents.eventType} = 'PAGE_VIEW'`, gte(siteEvents.createdAt, dayStart), sql`${siteEvents.createdAt} < ${dayEnd}`))
      .orderBy(desc(siteEvents.createdAt))
      .limit(DAY_EVENT_LIMIT);

    return Response.json({
      day: dayParam,
      visits: rows.map((row) => ({ path: row.path, label: labelForPath(row.path), createdAt: row.createdAt.toISOString() })),
    }, { headers: { "Cache-Control": "no-store" } });
  }

  const rangeParam = url.searchParams.get("range") ?? "30d";
  const days = RANGE_DAYS[rangeParam] ?? RANGE_DAYS["30d"];

  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const db = getDb();
  const [dailyRows, pathRows, dailyPathRows] = await Promise.all([
    db.select({
      day: sql<string>`to_char(date_trunc('day', ${siteEvents.createdAt}), 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
      .from(siteEvents)
      .where(and(sql`${siteEvents.eventType} = 'PAGE_VIEW'`, gte(siteEvents.createdAt, since)))
      .groupBy(sql`date_trunc('day', ${siteEvents.createdAt})`)
      .orderBy(sql`date_trunc('day', ${siteEvents.createdAt})`),
    db.select({
      path: siteEvents.path,
      count: sql<number>`count(*)::int`,
    })
      .from(siteEvents)
      .where(and(sql`${siteEvents.eventType} = 'PAGE_VIEW'`, gte(siteEvents.createdAt, since)))
      .groupBy(siteEvents.path)
      .orderBy(desc(sql`count(*)`))
      .limit(PATH_LIMIT),
    db.select({
      day: sql<string>`to_char(date_trunc('day', ${siteEvents.createdAt}), 'YYYY-MM-DD')`,
      path: siteEvents.path,
      count: sql<number>`count(*)::int`,
    })
      .from(siteEvents)
      .where(and(sql`${siteEvents.eventType} = 'PAGE_VIEW'`, gte(siteEvents.createdAt, since)))
      .groupBy(sql`date_trunc('day', ${siteEvents.createdAt})`, siteEvents.path)
      .orderBy(sql`date_trunc('day', ${siteEvents.createdAt})`, desc(sql`count(*)`)),
  ]);

  const countByDay = new Map(dailyRows.map((row) => [row.day, row.count]));
  const points: { date: string; count: number }[] = [];
  const cursor = new Date(since);
  for (let i = 0; i < days; i++) {
    const iso = cursor.toISOString().slice(0, 10);
    points.push({ date: iso, count: countByDay.get(iso) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const pathsByDay = new Map<string, { path: string; count: number }[]>();
  for (const row of dailyPathRows) {
    const existing = pathsByDay.get(row.day) ?? [];
    existing.push({ path: row.path, count: row.count });
    pathsByDay.set(row.day, existing);
  }

  return Response.json({
    points,
    topPaths: pathRows.map((row) => ({ path: row.path, label: labelForPath(row.path), count: row.count })),
    pathsByDay: Object.fromEntries([...pathsByDay.entries()].map(([day, rows]) => [day, rows.map((row) => ({ path: row.path, label: labelForPath(row.path), count: row.count }))])),
    totalViews: points.reduce((sum, p) => sum + p.count, 0),
    rangeDays: days,
  }, { headers: { "Cache-Control": "no-store" } });
}
