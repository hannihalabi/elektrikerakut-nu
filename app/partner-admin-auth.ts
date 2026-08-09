import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "elektrikerakut_admin";
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

type PartnerAdmin = { email: string; displayName: string };

function configuredEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
}

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? "";
}

function equal(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function signature(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function authenticatePartnerAdmin(email: string, password: string) {
  const expectedEmail = configuredEmail();
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";
  if (!expectedEmail || !expectedPassword || !sessionSecret()) return false;
  return equal(email.trim().toLowerCase(), expectedEmail) && equal(password, expectedPassword);
}

export function createPartnerAdminSession(email: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const payload = Buffer.from(JSON.stringify({ email: email.trim().toLowerCase(), expiresAt })).toString("base64url");
  return { token: `${payload}.${signature(payload)}`, expiresAt };
}

function verifySession(token: string): PartnerAdmin | null {
  const [payload, suppliedSignature] = token.split(".");
  if (!payload || !suppliedSignature || !sessionSecret() || !equal(suppliedSignature, signature(payload))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { email?: string; expiresAt?: number };
    if (!parsed.email || !parsed.expiresAt || parsed.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    if (!equal(parsed.email, configuredEmail())) return null;
    return { email: parsed.email, displayName: parsed.email };
  } catch {
    return null;
  }
}

export async function getPartnerAdmin() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return token ? verifySession(token) : null;
}

export async function requirePartnerAdmin() {
  const admin = await getPartnerAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
