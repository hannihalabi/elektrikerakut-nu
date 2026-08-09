import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("https://elektrikerakut.nu/", { headers: { accept: "text/html" } }),
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
  assert.match(page, /prefers-reduced-motion|aria-live/);
});

test("includes the generated social preview image", async () => {
  await access(new URL("../public/og.png", import.meta.url));
});
