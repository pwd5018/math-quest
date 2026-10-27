import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/firestore.rules.test.ts"],
    testTimeout: 15000,
    // Cold Firestore emulator rule compilation can exceed Vitest's 10s default.
    hookTimeout: 60000,
  },
});
