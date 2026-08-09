import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(new URL(pathname, "https://elektrikerakut.nu"), { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Elektrikerakut customer journey", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]+lang="sv"/i);
  assert.match(html, /Elektrikerakut\.nu – snabb hjälp vid akuta elproblem/);
  assert.match(html, /Akut elproblem/);
  assert.match(html, /Hitta elektriker nu/);
  assert.match(html, /förmedlingstjänst och utför inte elinstallationsarbete/);
  assert.match(html, /Prototyp: inga uppgifter skickas eller sparas ännu/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|Building your site/i);
});

test("removes the disposable starter and wires product metadata", async () => {
  const [layout, page, packageJson] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(layout, /images: \[\{ url: "\/og\.png"/);
  assert.match(page, /elapsed >= 4000/);
  assert.match(page, /value >= 10000 && value <= 19999/);
  assert.match(page, /Ops! Vi har just nu inga partners utanför Stockholm/);
  assert.match(page, /prefers-reduced-motion|aria-live/);
});

test("includes the generated social preview image", async () => {
  await access(new URL("../public/og.png", import.meta.url));
});

test("server-renders the partner application", async () => {
  const response = await render("/bli-partner");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Partneransökan/);
  assert.match(html, /Berätta om företaget/);
  assert.match(html, /Ansökan blir inte aktiv förrän/);
});

test("protects the partner register behind sign-in", async () => {
  const response = await render("/admin");
  assert.equal(response.status, 307);
  assert.match(response.headers.get("location") ?? "", /^\/signin-with-chatgpt\?return_to=%2Fadmin$/);
});

test("ships the partner schema and migration", async () => {
  const [schema, migration] = await Promise.all([
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0000_flippant_texas_twister.sql", import.meta.url), "utf8"),
  ]);

  assert.match(schema, /export const partners/);
  assert.match(schema, /SELF_SERVICE/);
  assert.match(schema, /registrationVerifiedAt/);
  assert.match(migration, /CREATE TABLE `partners`/);
  assert.match(migration, /PRAGMA optimize/);
});
