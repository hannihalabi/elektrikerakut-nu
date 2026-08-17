import { desc } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { indexNowSubmissions } from "../../../../../db/schema";
import { getPartnerAdmin } from "../../../../partner-admin-auth";

export const runtime = "nodejs";

type IndexNowAction = "UPDATED" | "DELETED";

const origin = "https://elektrikerakut.nu";

function responseMessage(status: number, body: string) {
  if (body.trim()) return body.trim().slice(0, 500);
  const messages: Record<number, string> = {
    200: "Mottagen av IndexNow",
    202: "Mottagen och köad",
    400: "Ogiltig begäran",
    403: "IndexNow-nyckeln kunde inte verifieras",
    422: "URL eller nyckel matchar inte webbplatsen",
    429: "För många begäranden",
  };
  return messages[status] ?? `HTTP ${status}`;
}

function publicHistory(row: typeof indexNowSubmissions.$inferSelect) {
  return {
    id: row.id,
    path: row.path,
    action: row.action as IndexNowAction,
    responseStatus: row.responseStatus,
    responseMessage: row.responseMessage,
    success: row.success,
    submittedAt: row.submittedAt.toISOString(),
  };
}

export async function GET() {
  const admin = await getPartnerAdmin();
  if (!admin) return Response.json({ error: "Åtkomst nekad." }, { status: 403 });

  try {
    const rows = await getDb().select().from(indexNowSubmissions).orderBy(desc(indexNowSubmissions.submittedAt)).limit(50);
    return Response.json({ history: rows.map(publicHistory) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ history: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: Request) {
  const admin = await getPartnerAdmin();
  if (!admin) return Response.json({ error: "Åtkomst nekad." }, { status: 403 });

  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key || !/^[A-Za-z0-9-]{8,128}$/.test(key)) {
    return Response.json({ error: "IndexNow är inte konfigurerat. Lägg till en giltig INDEXNOW_KEY i Vercel." }, { status: 503 });
  }

  try {
    const body = await request.json() as { paths?: unknown; action?: unknown };
    const action: IndexNowAction = body.action === "DELETED" ? "DELETED" : "UPDATED";
    const paths = Array.isArray(body.paths)
      ? [...new Set(body.paths.filter((path): path is string => typeof path === "string" && path.startsWith("/") && !path.startsWith("//") && path.length <= 500))]
      : [];
    if (!paths.length || paths.length > 100) return Response.json({ error: "Välj mellan 1 och 100 URL:er per IndexNow-anrop." }, { status: 400 });

    const urlList = paths.map((path) => `${origin}${path}`);
    let status: number | null = null;
    let message = "IndexNow kunde inte nås";
    let success = false;

    try {
      const response = await fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          host: "elektrikerakut.nu",
          key,
          keyLocation: `${origin}/indexnow-key.txt`,
          urlList,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      });
      status = response.status;
      message = responseMessage(response.status, await response.text());
      success = response.ok;
    } catch (error) {
      message = error instanceof Error ? error.message.slice(0, 500) : "IndexNow kunde inte nås";
    }

    const submittedAt = new Date();
    try {
      await getDb().insert(indexNowSubmissions).values(paths.map((path) => ({
        path,
        action,
        responseStatus: status,
        responseMessage: message,
        success,
        submittedAt,
      })));
    } catch (error) {
      console.error("[indexnow] Kunde inte spara historiken", { error: error instanceof Error ? error.message : String(error) });
    }

    const history = paths.map((path, index) => ({
      id: -1 - index,
      path,
      action,
      responseStatus: status,
      responseMessage: message,
      success,
      submittedAt: submittedAt.toISOString(),
    }));
    return Response.json({ history, error: success ? undefined : message }, { status: success ? 200 : 502, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "IndexNow-begäran var ogiltig." }, { status: 400 });
  }
}
