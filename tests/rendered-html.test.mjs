import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("keeps the Elektrikerakut customer journey and area guard", async () => {
  const [layout, page] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /metadataBase: new URL\("https:\/\/elektrikerakut\.nu"\)/);
  assert.match(layout, /Elektrikerakut\.nu – snabb hjälp vid akuta elproblem/);
  assert.match(page, /elapsed >= 7000/);
  assert.match(page, /value >= 10000 && value <= 19999/);
  assert.match(page, /Ops! Vi har just nu inga partners utanför Stockholm/);
  assert.match(page, /förmedlingstjänst och utför inte elinstallationsarbete/);
  assert.match(page, /Vad har hänt\?/);
  assert.match(page, /Bli kontaktad inom 2 minuter/);
  assert.match(page, /className="header-login" href="\/admin\/login" aria-label="Logga in"/);
  assert.match(page, /matchCardRef\.current\?\.scrollIntoView/);
  assert.match(page, /requestAnimationFrame/);
  assert.match(page, /prefers-reduced-motion|aria-live/);
  const matchRoute = await readFile(new URL("../app/api/match/route.ts", import.meta.url), "utf8");
  assert.match(matchRoute, /eq\(partners\.status, "ACTIVE"\)/);
  assert.match(matchRoute, /ISSUE_CAPABILITIES/);
  assert.match(page, /fetch\("\/api\/match"/);
  assert.match(page, /fetch\("\/api\/requests"/);
  assert.match(page, /postcode, phone/);
  assert.match(page, /matchedPartner\?\.legalName/);
  assert.match(page, /matchedPartner\?\.logoUrl/);
  assert.match(page, /partner-logo/);
  const adminPartners = await readFile(new URL("../app/admin/partners-admin.tsx", import.meta.url), "utf8");
  assert.match(adminPartners, /Klicka för att ladda upp logo/);
  assert.doesNotMatch(adminPartners, /className="logo-upload"/);
  assert.match(page, /callbackSeconds/);
  assert.match(page, /Vi ringer dig inom 2 minuter/);
  assert.doesNotMatch(page, /Ring \{matchedPartner\.legalName\}/);
});

test("keeps the partner application", async () => {
  const application = await readFile(new URL("../app/bli-partner/partner-application.tsx", import.meta.url), "utf8");
  assert.match(application, /Partneransökan/);
  assert.match(application, /Berätta om företaget/);
  assert.match(application, /Ansökan blir inte aktiv förrän/);
  assert.match(application, /fetch\("\/api\/partners"/);
});

test("protects admin with a signed Vercel-compatible session", async () => {
  const [adminPage, auth, login, resetRequest, resetConfirm, resetPage, migration] = await Promise.all([
    readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/partner-admin-auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/login/admin-login.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/password-reset/request/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/password-reset/confirm/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/aterstall-losenord/password-reset.tsx", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0008_admin_password_recovery.sql", import.meta.url), "utf8"),
  ]);

  assert.match(adminPage, /requirePartnerAdmin/);
  assert.match(auth, /createHmac\("sha256"/);
  assert.match(auth, /httpOnly|ADMIN_COOKIE/);
  assert.match(auth, /ADMIN_SESSION_SECRET/);
  assert.match(auth, /SESSION_DURATION_SECONDS = 60 \* 60 \* 8/);
  assert.match(login, /\/api\/admin\/session/);
  assert.match(login, /Glömt lösenordet/);
  assert.match(resetRequest, /RESEND_API_KEY/);
  assert.match(resetRequest, /noreply@/);
  assert.match(resetRequest, /SUCCESS_MESSAGE/);
  assert.match(resetConfirm, /resetAdminPassword/);
  assert.match(resetPage, /minLength=\{12\}/);
  assert.match(auth, /RESET_TOKEN_DURATION_MS = 30 \* 60 \* 1000/);
  assert.match(auth, /scrypt/);
  assert.match(migration, /admin_password_reset_tokens/);
  const analyticsRoute = await readFile(new URL("../app/api/admin/analytics/route.ts", import.meta.url), "utf8");
  const analyticsPage = await readFile(new URL("../app/admin/statistik/analytics-dashboard.tsx", import.meta.url), "utf8");
  assert.match(analyticsRoute, /siteEvents/);
  assert.match(analyticsPage, /Besök senaste 30 dagar/);
});

test("uses Next.js and Postgres without Cloudflare runtime files", async () => {
  const [packageJson, schema, migration] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0000_cooing_mercury.sql", import.meta.url), "utf8"),
  ]);

  assert.match(packageJson, /"build": "next build"/);
  assert.match(packageJson, /@neondatabase\/serverless/);
  assert.doesNotMatch(packageJson, /vinext|wrangler|@cloudflare/);
  assert.match(schema, /pgTable/);
  assert.match(schema, /jsonb\("capabilities"\)/);
  assert.match(schema, /text\("logo_url"\)/);
  assert.match(migration, /CREATE TABLE "partners"/);
  assert.match(schema, /pgTable\(\s*"site_events"/);
  assert.match(schema, /pgTable\(\s*"service_requests"/);

  await assert.rejects(access(new URL("../.openai/hosting.json", import.meta.url)));
  await assert.rejects(access(new URL("../vite.config.ts", import.meta.url)));
  await assert.rejects(access(new URL("../app/chatgpt-auth.ts", import.meta.url)));
});

test("includes the call center request workflow", async () => {
  const [callCenter, requestsRoute, migration, timeMigration] = await Promise.all([
    readFile(new URL("../app/admin/call-center/call-center.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/requests/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0003_early_bloodstrike.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0004_high_abomination.sql", import.meta.url), "utf8"),
  ]);
  assert.match(callCenter, /Call center/);
  assert.match(callCenter, /Tid att ringa/);
  assert.match(callCenter, /Boka/);
  assert.match(callCenter, /Tidigare ärenden/);
  assert.match(callCenter, /historyRequests/);
  assert.match(requestsRoute, /serviceRequests/);
  assert.match(migration, /CREATE TABLE "service_requests"/);
  assert.match(timeMigration, /called_at/);
  assert.match(timeMigration, /booked_at/);
  assert.match(timeMigration, /closed_at/);
});

test("includes the generated brand and team assets", async () => {
  await Promise.all([
    access(new URL("../public/og.png", import.meta.url)),
    access(new URL("../public/favicon/elektrikerakut-favicon.svg", import.meta.url)),
    access(new URL("../public/personal2.png", import.meta.url)),
  ]);
});
