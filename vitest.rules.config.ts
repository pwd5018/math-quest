import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/*.rules.test.ts"],
    fileParallelism: false,
    testTimeout: 15000,
    // Cold Firestore emulator rule compilation can exceed Vitest's 10s default.
    hookTimeout: 60000,
  },
});
