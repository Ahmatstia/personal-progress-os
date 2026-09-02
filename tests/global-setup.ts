import { execSync } from "node:child_process";
import fs from "node:fs";
import { TEST_DB_PATH } from "./test-db";

export default function setup() {
  fs.rmSync(TEST_DB_PATH, { force: true });
  fs.rmSync(`${TEST_DB_PATH}-journal`, { force: true });
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: `file:${TEST_DB_PATH}` },
  });
}