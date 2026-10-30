import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, unlink, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { verifyHosting } from "./verify-hosting.mjs";

async function fixture(run) {
  const directory = await mkdtemp(join(tmpdir(), "math-quest-hosting-"));
  const assets = join(directory, "assets");
  await mkdir(assets);
  const index = "<html>current release</html>";
  const script = "console.log('current release')";
  await writeFile(join(directory, "index.html"), index);
  await writeFile(join(assets, "app.js"), script);
  try {
    await run({ directory, index, script });
  } finally {
    await unlink(join(directory, "index.html"));
    await unlink(join(assets, "app.js"));
    await rmdir(assets);
    await rmdir(directory);
  }
}

test("verifies every built file against the fixed HTTPS site", async () => {
  await fixture(async ({ directory, index, script }) => {
    const requested = [];
    const count = await verifyHosting({
      directory,
      fetchFile: async (url, options) => {
        assert.equal(url.origin, "https://math-quest-2d6e5.web.app");
        assert.equal(options.headers["Cache-Control"], "no-cache");
        requested.push(url.pathname);
        return new Response(url.pathname === "/index.html" ? index : script);
      },
    });
    assert.equal(count, 2);
    assert.deepEqual(requested.sort(), ["/assets/app.js", "/index.html"]);
  });
});
test("rejects a successful HTTP response containing a stale release", async () => {
  await fixture(async ({ directory }) => {
    await assert.rejects(
      verifyHosting({
        directory,
        fetchFile: async () => new Response("old release"),
      }),
      /differs from this build/,
    );
  });
});
test("rejects an unavailable deployment", async () => {
  await fixture(async ({ directory }) => {
    await assert.rejects(
      verifyHosting({
        directory,
        fetchFile: async () => new Response("Not found", { status: 404 }),
      }),
      /HTTP 404/,
    );
  });
});
