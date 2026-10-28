// A production cloud build must not accidentally point at the local emulators.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const file = (() => {
  try {
    return readFileSync(".env.local", "utf8");
  } catch {
    return "";
  }
})();
const value = (key) =>
  process.env[key] ?? file.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim();
for (const key of [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_APP_ID",
]) {
  if (!value(key))
    throw new Error(
      `Missing ${key}; configure public Firebase web fields before publishing.`,
    );
}
if (value("VITE_FIREBASE_PROJECT_ID").startsWith("demo-"))
  throw new Error(
    "A demo project cannot be used for the published cloud build.",
  );
const env = {
  ...process.env,
  VITE_APP_MODE: "firebase",
  VITE_FIREBASE_EMULATORS: "false",
};
const typecheck = spawnSync(
  process.execPath,
  ["node_modules/typescript/bin/tsc", "-b"],
  { stdio: "inherit", env },
);
if (typecheck.status !== 0) process.exit(typecheck.status ?? 1);
const build = spawnSync(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "build"],
  { stdio: "inherit", env },
);
process.exit(build.status ?? 1);
