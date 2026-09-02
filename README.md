# Personal Progress OS

Sistem pribadi untuk mengelola **goal → stage → task → session fokus** dan memahami progres
diri lewat data, refleksi mingguan, serta asisten AI berbasis perintah (command-based).

Dibangun dengan **Next.js (App Router)**, **Prisma + SQLite (better-sqlite3)**, dan **Zod**.

## Model Produk

```
Goal
  ↓
Stage        (bagian bermakna dari perjalanan goal)
  ↓
Task
  ↓
Session      (sesi fokus ber-timer + refleksi)
```

Lintas potong: **DailyFocus** (fokus harian), **Review** (refleksi mingguan), **Capture**
(catat cepat), **User**, dan **AI Assistant**.
Siklus produk: ORIENT → DECIDE → DO → REVIEW → IMPROVE.

## Prasyarat

- Node.js 20+ (disarankan 22)
- npm
- Python 3.10+ (hanya untuk pipeline NLP opsional)

## Setup Lokal

1. Install dependensi:

   ```bash
   npm install
   ```

2. Siapkan environment:

   ```bash
   copy .env.example .env
   ```

   Isi `AUTH_SECRET` dan `AUTH_ACCESS_CODE` dengan nilai acak kuat:

   ```bash
   openssl rand -hex 24        # AUTH_SECRET
   ```

   Gunakan passphrase panjang untuk `AUTH_ACCESS_CODE` (ini **satu-satunya gerbang
   autentikasi aplikasi**).

3. Migrasi database:

   ```bash
   npx prisma migrate deploy
   ```

4. (Opsional) Seed data contoh:

   ```bash
   npm run db:seed
   ```

5. Jalankan:

   ```bash
   npm run dev
   ```

   Buka http://localhost:3000 dan masuk dengan `AUTH_ACCESS_CODE` Anda.

## Environment Variables

| Variabel | Wajib di production | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | Ya | Lokasi database SQLite, mis. `file:./prisma/dev.db` |
| `AUTH_SECRET` | Ya | HMAC secret untuk sesi & token konfirmasi AI. `openssl rand -hex 24`. **Fail-closed**: bila kosong di production, aplikasi menolak membuat/memvalidasi sesi. |
| `AUTH_ACCESS_CODE` | Ya | Kode akses login. Bila kosong, endpoint login merespons `503 AUTH_NOT_CONFIGURED`. |

Jangan pernah menulis nilai secret asli ke file yang di-commit. `.env` di-git-ignore;
`.env.example` hanya berisi placeholder.

## Database

- Provider: **SQLite**, driver `better-sqlite3`.
- Prisma client di-generate ke `src/generated/prisma` (`npx prisma generate`).
- Migrasi ada di `prisma/migrations` dan diterapkan dengan `npx prisma migrate deploy`.
- **`prisma/dev.db` tidak dilacak Git** agar data development lokal tidak pernah ter-commit.
- Setiap model memiliki index `userId`; relasi memakai `onDelete: Cascade` (menghapus goal
  menghapus stage → task → session/focus/review; menghapus user menghapus semuanya).

## Development Commands

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Build produksi (Next.js) |
| `npm start` | Menjalankan build produksi |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (unit/integration/security) |
| `npm run nlp:test` | Unit test pipeline NLP (Python) |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:generate` | `prisma generate` |
| `npm run db:seed` | Seed contoh |
| `npm run db:studio` | Prisma Studio |

## Testing

- **JavaScript/TS (Vitest):** `npm run test`

  Menggunakan database temp terpisah di `os.tmpdir()` (`ppos-vitest.db`); data development
  lokal tidak tersentuh. Mencakup: auth & cookie signing, ownership/IDOR (unit + HTTP),
  CRUD, siklus sesi, fokus, review, AI command (konfirmasi, ambiguous task, low confidence,
  unknown), dan timelock.

- **NLP (Python):** `npm run nlp:test`

  Memvalidasi corpus, normalisasi, ranking intent, serta model baseline/transformer/embedding
  bila artefak model tersedia.

## Build & Deployment Model

> **Model yang didukung saat ini (V1.0): server Node.js satu-instance dengan filesystem persisten.**

- Aplikasi menggunakan **SQLite** sebagai satu-satunya datastore. SQLite membutuhkan
  **dekstop file yang persisten dan dapat ditulis** di lokasi tetap.
- Oleh karena itu **tidak cocok untuk runtime serverless stateless** (mis. Vercel
  Functions/Lambda) — instance baru tidak menjamin filesystem yang sama, sehingga data bisa
  hilang/terpisah.
- `next.config.ts` menandai `better-sqlite3` sebagai `serverExternalPackages` dan mematikan
  header `powered-by`; gunakan **Node.js runtime** untuk route handler.

Cara men-deploy yang direkomendasikan:

1. `npm ci`
2. `npx prisma generate`
3. `npx prisma migrate deploy`
4. `npm run build`
5. `npm start` (di balik reverse proxy + HTTPS) **atau** image Docker satu-container

Persyaratan operasional:

- `AUTH_SECRET` & `AUTH_ACCESS_CODE` di-set dari environment (wajib di production).
- Database SQLite di **volume persisten** (Docker volume / disk tetap VM). Lokasi default
  `prisma/dev.db`; sesuaikan `DATABASE_URL` di production.
- Tunggal instance. **Skala lebih lanjut (multi-instance, PostgreSQL, serverless) adalah
  opsi future (V1.1+/V2 backlog)** — bukan bagian dari deployment model V1.0.

## Security Notes

- Autentikasi: kode akses server-side (`AUTH_ACCESS_CODE`) + sesi HMAC-signed, `httpOnly`,
  `sameSite=lax`, `secure` di production, TTL 30 hari. **Identitas tidak pernah dipercaya
  dari client.**
- Authorization: setiap query service/repository menyertakan `userId` dari sesi;
  resource milik user lain diperlakukan sebagai "tidak ditemukan" (404).
- Rate limiting login: 10 percobaan / 15 menit per IP (in-memory; per-proses).
- Fail-closed: produksi tanpa `AUTH_SECRET` → seluruh sesi dianggap invalid (401);
  tanpa `AUTH_ACCESS_CODE` → login menolak (503).
- Error API tidak menyertakan stack trace, secret, path internal, atau data sensitif.
- Sebelum rilis, **ganti `AUTH_SECRET` dan `AUTH_ACCESS_CODE`** dengan nilai baru; jangan
  meng-commit nilai secret lama/baru ke repository.

## AI Safety

Asisten bersifat **command-based & deterministic** (bukan LLM agent). Pipeline:

```
User input → interpretasi → confidence → routing → resolusi context
→ authorization (ownership) → konfirmasi jika write → eksekusi
```

- Read hanya dieksekusi bila confidence ≥ MEDIUM; LOW/UNKNOWN tidak mengeksekusi apa pun.
- Setiap **write command wajib konfirmasi eksplisit** dengan token HMAC-signed yang
  **terikat pada intent, userId, dan TTL 10 menit** — `confirmed: true` dari client tanpa
  token tidak pernah cukup.
- Task ambigu → pemilih kandidat (selector); eksekusi ulang membawa token yang sama.
- Semantic AI (intents, korpus, NLP) tidak memakai secret; pipeline TS di `src/ai` dan
  pipeline Python di `nlp/`.

## Known Limitations

- SQLite single-instance: tidak ada HA/scale-out pada V1.0 (lihat Deployment Model).
- Rate limiter login in-memory: hanya berlaku per-proses/instance.
- Duplikasi sesi aktif dicegah di layer service; tidak ada constraint unik DB parsial untuk
  sesi aktif (race hanya pada request konkuren simultan).
- NLP pipeline opsional yang men-download model tidak termasuk dalam CI JavaScript.
- Drawer/modal AI tidak menggunakan focus-trap penuh (Escape & klik-luar berfungsi).
- Tidak ada fitur notifikasi, kalender, kolaborasi, ataupun sinkronisasi cloud (lihat backlog).

## Backlog / Roadmap (bukan bagian V1.0)

LLM assistant, conversational memory, embedding/semantic search, AI planning/rekomendasi,
notifikasi, integrasi kalender, recurring goals, analytics yang lebih kaya, multi-user/PostgreSQL,
deployment cloud & aplikasi mobile.

---

Dokumen terkait: `PHASE_17_FINAL_REPORT.md`, `PHASE_18_UX_VALIDATION.md`,
`PHASE_19_FINAL_REPORT.md`.