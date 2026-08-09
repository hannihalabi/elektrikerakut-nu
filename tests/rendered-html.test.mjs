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
  assert.match(page, /elapsed >= 4000/);
  assert.match(page, /value >= 10000 && value <= 19999/);
  assert.match(page, /Ops! Vi har just nu inga partners utanför Stockholm/);
  assert.match(page, /förmedlingstjänst och utför inte elinstallationsarbete/);
  assert.match(page, /Teamet bakom Elektrikerakut\.nu/);
  assert.match(page, /personalImage/);
  assert.match(page, /className="header-partner" href="\/bli-partner"/);
  assert.match(page, /className="header-login" href="\/admin\/login" aria-label="Logga in"/);
  assert.match(page, /matchCardRef\.current\?\.scrollIntoView/);
  assert.match(page, /requestAnimationFrame/);
  assert.match(page, /prefers-reduced-motion|aria-live/);
});

test("keeps the partner application", async () => {
  const application = await readFile(new URL("../app/bli-partner/partner-application.tsx", import.meta.url), "utf8");
  assert.match(application, /Partneransökan/);
  assert.match(application, /Berätta om företaget/);
  assert.match(application, /Ansökan blir inte aktiv förrän/);
  assert.match(application, /fetch\("\/api\/partners"/);
});

test("protects admin with a signed Vercel-compatible session", async () => {
  const [adminPage, auth, login] = await Promise.all([
    readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/partner-admin-auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/login/admin-login.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(adminPage, /requirePartnerAdmin/);
  assert.match(auth, /createHmac\("sha256"/);
  assert.match(auth, /httpOnly|ADMIN_COOKIE/);
  assert.match(auth, /ADMIN_SESSION_SECRET/);
  assert.match(login, /\/api\/admin\/session/);
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
  assert.match(migration, /CREATE TABLE "partners"/);

  await assert.rejects(access(new URL("../.openai/hosting.json", import.meta.url)));
  await assert.rejects(access(new URL("../vite.config.ts", import.meta.url)));
  await assert.rejects(access(new URL("../app/chatgpt-auth.ts", import.meta.url)));
});

test("includes the generated brand and team assets", async () => {
  await Promise.all([
    access(new URL("../public/og.png", import.meta.url)),
    access(new URL("../public/favicon.png", import.meta.url)),
    access(new URL("../public/personal2.png", import.meta.url)),
  ]);
});
