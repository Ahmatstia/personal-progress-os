import { defineConfig } from "vitest/config";
import path from "node:path";
import { TEST_DB_PATH } from "./tests/test-db";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    fileParallelism: false,
    globalSetup: "./tests/global-setup.ts",
    env: {
      DATABASE_URL: `file:${TEST_DB_PATH}`,
      AUTH_SECRET: "test-secret-for-vitest-only",
      AUTH_ACCESS_CODE: "test-access-code",
    },
  },
});