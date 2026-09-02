import os from "node:os";
import path from "node:path";

// Database SQLite sementara yang dipakai seluruh suite ketika `npm run test`,
// terpisah dari `prisma/dev.db` agar data development tidak tercemari/tabrakan.
export const TEST_DB_PATH = path.join(os.tmpdir(), "ppos-vitest.db");