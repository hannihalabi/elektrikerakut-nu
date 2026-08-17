import { NextResponse } from "next/server";
import { ADMIN_COOKIE, authenticatePartnerAdmin, createPartnerAdminSession } from "../../../partner-admin-auth";

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 10_000) return NextResponse.json({ error: "Förfrågan är för stor." }, { status: 413 });

  try {
    const payload = await request.json() as Record<string, unknown>;
    const email = text(payload.email, 160).toLowerCase();
    const password = text(payload.password, 300);
    if (!await authenticatePartnerAdmin(email, password)) {
      await new Promise((resolve) => setTimeout(resolve, 450));
      return NextResponse.json({ error: "Fel e-postadress eller lösenord." }, { status: 401 });
    }

    const { token, expiresAt } = createPartnerAdminSession(email);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: new Date(expiresAt * 1000),
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Inloggningen kunde inte genomföras." }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
