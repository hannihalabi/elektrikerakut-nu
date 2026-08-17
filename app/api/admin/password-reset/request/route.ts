import { Resend } from "resend";
import { createPasswordResetToken, savePasswordResetToken } from "../../../../partner-admin-auth";

const SUCCESS_MESSAGE = "Om adressen är registrerad skickar vi en återställningslänk inom några minuter.";
const RATE_LIMIT_MS = 60_000;
const requests = new Map<string, number>();

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 10_000) return Response.json({ error: "Förfrågan är för stor." }, { status: 413 });

  try {
    const payload = await request.json() as Record<string, unknown>;
    const email = text(payload.email, 160).toLowerCase();
    const now = Date.now();
    const previousRequest = requests.get(email) ?? 0;
    if (!email || previousRequest + RATE_LIMIT_MS > now) return Response.json({ ok: true, message: SUCCESS_MESSAGE });
    requests.set(email, now);

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const resendKey = process.env.RESEND_API_KEY;
    const emailDomain = process.env.RESEND_EMAIL_DOMAIN;
    if (!adminEmail || email !== adminEmail || !resendKey || !emailDomain) return Response.json({ ok: true, message: SUCCESS_MESSAGE });

    const token = createPasswordResetToken();
    await savePasswordResetToken(email, token);
    const origin = new URL(request.url).origin;
    const resetUrl = `${origin}/admin/aterstall-losenord?token=${encodeURIComponent(token)}`;
    const resend = new Resend(resendKey);
    const { error } = await resend.emails.send({
      from: `Elektrikerakut.nu <noreply@${emailDomain}>`,
      to: email,
      subject: "Återställ lösenordet till Elektrikerakut.nu",
      html: `<main style="font-family:Arial,sans-serif;color:#10233f;line-height:1.55"><h1>Återställ ditt lösenord</h1><p>Vi har fått en begäran om att återställa lösenordet till Elektrikerakut.nu.</p><p><a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#1668e8;color:#fff;text-decoration:none;font-weight:700">Välj nytt lösenord</a></p><p>Länken fungerar en gång och gäller i 30 minuter. Om du inte begärde återställningen kan du bortse från det här mejlet.</p></main>`,
    });
    if (error) console.error("Password reset email could not be sent", error);
  } catch {
    // Always use the same response so the endpoint cannot reveal account information.
  }

  return Response.json({ ok: true, message: SUCCESS_MESSAGE });
}
