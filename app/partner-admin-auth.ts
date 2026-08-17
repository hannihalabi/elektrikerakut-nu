import "server-only";

import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "../db";
import { adminCredentials, adminPasswordResetTokens } from "../db/schema";

export const ADMIN_COOKIE = "elektrikerakut_admin";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;
const RESET_TOKEN_DURATION_MS = 30 * 60 * 1000;

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

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function scrypt(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => scryptCallback(password, salt, 64, (error, key) => error ? reject(error) : resolve(key)));
}

export async function hashAdminPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt);
  return `scrypt$${salt}$${key.toString("hex")}`;
}

async function verifyAdminPassword(password: string, storedHash: string) {
  const [algorithm, salt, digest] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !digest) return false;
  const key = await scrypt(password, salt);
  return equal(key.toString("hex"), digest);
}

function signature(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export async function authenticatePartnerAdmin(email: string, password: string) {
  const expectedEmail = configuredEmail();
  const normalizedEmail = email.trim().toLowerCase();
  if (!expectedEmail || !sessionSecret() || !equal(normalizedEmail, expectedEmail)) return false;

  const db = getDb();
  const [credential] = await db.select().from(adminCredentials).where(eq(adminCredentials.email, expectedEmail)).limit(1);
  if (credential) return verifyAdminPassword(password, credential.passwordHash);

  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";
  return Boolean(expectedPassword) && equal(password, expectedPassword);
}

export function createPasswordResetToken() {
  return randomBytes(32).toString("base64url");
}

export async function savePasswordResetToken(email: string, token: string) {
  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();
  await db.delete(adminPasswordResetTokens).where(eq(adminPasswordResetTokens.email, normalizedEmail));
  await db.insert(adminPasswordResetTokens).values({
    email: normalizedEmail,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + RESET_TOKEN_DURATION_MS),
  });
}

export async function resetAdminPassword(token: string, password: string) {
  const db = getDb();
  const [reset] = await db.select().from(adminPasswordResetTokens).where(and(
    eq(adminPasswordResetTokens.tokenHash, sha256(token)),
    gt(adminPasswordResetTokens.expiresAt, new Date()),
    isNull(adminPasswordResetTokens.usedAt),
  )).orderBy(desc(adminPasswordResetTokens.createdAt)).limit(1);
  if (!reset || !equal(reset.email, configuredEmail())) return false;

  const passwordHash = await hashAdminPassword(password);
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.insert(adminCredentials).values({ email: reset.email, passwordHash }).onConflictDoUpdate({
      target: adminCredentials.email,
      set: { passwordHash, updatedAt: now },
    });
    await tx.update(adminPasswordResetTokens).set({ usedAt: now }).where(eq(adminPasswordResetTokens.email, reset.email));
  });
  return true;
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
