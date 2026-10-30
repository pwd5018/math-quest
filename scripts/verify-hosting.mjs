import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";

const site = "https://math-quest-2d6e5.web.app";
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function verifyHosting({
  directory = "dist",
  fetchFile = fetch,
} = {}) {
  const root = resolve(directory);
  async function walk(folder) {
    const entries = await readdir(folder, { withFileTypes: true });
    const files = await Promise.all(
      entries.map((entry) => {
        const path = resolve(folder, entry.name);
        if (entry.isSymbolicLink())
          throw new Error("Symlinks are not release files.");
        return entry.isDirectory() ? walk(path) : [path];
      }),
    );
    return files.flat();
  }
  const files = await walk(root);
  if (!files.includes(resolve(root, "index.html")))
    throw new Error("Missing built index.html.");
  for (const path of files) {
    const name = relative(root, path).split(sep).join("/");
    const url = new URL(
      name.split("/").map(encodeURIComponent).join("/"),
      site + "/",
    );
    const response = await fetchFile(url, {
      headers: { "Cache-Control": "no-cache" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok)
      throw new Error(
        `Hosting verification failed: ${name} (HTTP ${response.status}).`,
      );
    if (
      digest(await readFile(path)) !==
      digest(Buffer.from(await response.arrayBuffer()))
    )
      throw new Error(`Hosting file differs from this build: ${name}.`);
    console.log(`Verified ${name}`);
  }
  return files.length;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  await verifyHosting();
