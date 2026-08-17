import { resetAdminPassword } from "../../../../partner-admin-auth";

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 10_000) return Response.json({ error: "Förfrågan är för stor." }, { status: 413 });

  try {
    const payload = await request.json() as Record<string, unknown>;
    const token = text(payload.token, 300);
    const password = text(payload.password, 300);
    if (token.length < 32 || password.length < 12) return Response.json({ error: "Välj ett lösenord med minst 12 tecken." }, { status: 400 });
    if (!await resetAdminPassword(token, password)) return Response.json({ error: "Länken är ogiltig eller har gått ut. Begär en ny återställningslänk." }, { status: 400 });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Lösenordet kunde inte återställas. Försök igen." }, { status: 500 });
  }
}
