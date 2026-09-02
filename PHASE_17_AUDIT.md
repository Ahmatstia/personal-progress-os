# PHASE_17_AUDIT · Personal Progress OS — Full Audit & Production Hardening

Tanggal audit: 2026-09-02
Metode: 5 subagent audit paralel (Security / AI-Safety / Database / Frontend-UX / Production-Testing) + verifikasi baris-per-baris terhadap kode aktual.

## Executive summary

Personal Progress OS adalah aplikasi **single-user-per-ha "progressive goals"** (Goal → Stage → Task → Session, plus DailyFocus/Review/Capture), arsitektur Next.js App Router + Prisma + SQLite, otentikasi berbasis akses-code dengan sesi HMAC-signed cookie. Arsitektur lapisan service/repository **sudah baik**: semua query hampir selalu dibatasi `userId`, akses code dibandingkan di sisi server, dan lapisan AI Safety (confidence → confirmation) sudah ada.

Namun ada **2 temuan P0** (fallback secret/kode akses hardcoded yang dapat dipalsukan/ditebak) dan **beberapa P1** (konfirmasi AI yang dapat dilewati client, beberapa repository delete tidak diskoping userId, race pembuatan sesi, pengujian HTTP yang menulis ke database dev asli, dan error handling 401 vs 500 yang rapuh berbasis string `error.message`).

KLASIFIKASI TINGKAT KEPARAHAN: **P0** = wajib diperbaiki sekarang (dampak keamanan/kehilangan data), **P1** = wajib diperbaiki pada fase ini, **P2** = perbaikan direkomendasikan (djaga selain batasan), **P3** = polish.

Garansi verifikasi saat ini (baseline pra-fix): `tsc --noEmit` bersih, `lint` bersih, `test` 15 file / 115 test lulus, `build` sukses.

---

## A. Ringkasan temuan

| ID | Severity | Kategori | Inti masalah | File |
|----|----------|----------|--------------|------|
| F-001 | **P0** | Security/Config (V) | `AUTH_SECRET` fallback ke konstanta publik `"development-only-change-me"` → token sesi HMAC dapat dipalsukan untuk user mana pun | `src/lib/auth.ts:8-10` |
| F-002 | **P0** | Security/Auth (V) | `AUTH_ACCESS_CODE` fallback ke konstanta publik `"development-access-code"` yang juga di-pre-fill di form login → autentikasi dapat diterobos siapa pun | `src/app/api/auth/login/route.ts:9`, `src/app/components/LoginForm.tsx:49` |
| F-003 | **P1** | AI Safety (K) | `confirmed: true` sepenuhnya dipercaya dari client; tanpa nonce/token server → "konfirmasi tulis" hanyalah konvensi UI dan dapat dilewati | `src/ai/safety.ts:7-8`, `src/schemas/ai-command.schema.ts:13`, `src/services/ai-command.service.ts:43-53` |
| F-004 | **P1** | Otorisasi/IDOR (O) | 4 repository hubungi `delete`/`deleteCaptureById` **tanpa** filter `userId` (hanya pre-check di service, tidak transaksional) | `src/repositories/goal.repository.ts:11`, `stage.repository.ts:12`, `today.repository.ts:46`, `session.repository.ts:80` |
| F-005 | **P1** | Database integrity (G) | `startSession` check-then-act tanpa transaksi; guard hanya per-task → beberapa sesi aktif bisa berdampingan; `SESSION_END` mengakhiri sesi "pertama" | `src/services/session.service.ts:31-52` |
| F-006 | **P1** | Database integrity (G) | `updateTaskActualHours` = aggregate lalu update dalam dua statement non-atomik (race) | `src/services/session.service.ts:70-76` |
| F-007 | **P1** | Error handling/auth (N) | Beberapa route mengembalikan **500** untuk request tanpa autentikasi, dan pola `error.message === "Autentikasi diperlukan."` yang rapuh tersebar di 6+ route | `sessions/[id]`, `goals/[id]/reviews`, `tasks/[id]`, `analytics`, dll. |
| F-008 | **P1** | Testing (U) | Test HTTP integrasi berjalan terhadap **`prisma/dev.db` asli** (path hardcoded di `src/lib/prisma.ts:8-10`), tidak ada isolasi DB selagi test | `src/lib/prisma.ts`, `vitest.config.ts` |
| F-009 | **P1** | Testing (U) | Alur auth (login/logout/me, expired/tampered cookie) & aksi tulis AI nyaris tanpa test; cakupan keamanan hanya di `task.service` | `tests/idor.security.test.ts`, `tests/idor.http.integration.test.ts` |
| F-010 | P2 | Security/Auth (V) | Login tanpa constant-time compare & tanpa rate limiting (brute-force/timing) | `src/app/api/auth/login/route.ts` |
| F-011 | P2 | AI / ownership (J) | `resolveTask` fallback `"test-user"` bila `userId` kosong → berisiko bila dipanggil tanpa konteks user | `src/services/ai-command.service.ts:35` |
| F-012 | P2 | UX/error handling (M) | `LoginForm` fetch tanpa `try/catch` → unhandled rejection saat jaringan gagal | `src/app/components/LoginForm.tsx:10-27` |
| F-013 | P2 | UX/error handling (M) | Logout di `Sidebar` tanpa `try/catch` | `src/app/components/shell/Sidebar.tsx:36-40` |
| F-014 | P2 | UX/state (M) | `SessionFocusMode` tidak sinkron bila sesi dimulai/diakhiri dari tempat lain (stale) | berbagai halaman + komponen sesi |
| F-015 | P2 | A11y (N) | Tombol AI header tanpa `aria-label`; drawer AI tanpa Escape & tanpa focus trap; pill teks meluap di mobile | `src/app/components/shell/AppShell.tsx` |
| F-016 | P2 | A11y/Responsive (N) | Aksi `TaskItem` hanya muncul saat hover (opacity) → tidak terakses di touch | komponen TaskItem |
| F-017 | P2 | Error boundary (N) | Deep-link tanpa sesi / sesi kedaluwarsa → halaman 500 mentah; tidak ada `error.tsx`/`not-found.tsx`; `(app)/layout.tsx` menelan throw tanpa redirect | `src/app/(app)/layout.tsx:13-20` |
| F-018 | P2 | Production (Y) | Tidak ada `.env.example`; tidak ada `serverExternalPackages`; `poweredByHeader` masih aktif | `.env*`, `next.config.ts` |
| F-019 | P2 | Maintainability | Branches `process.env.NODE_ENV === "test"` di `session.service.ts` (signature berbeda untuk test) | `src/services/session.service.ts:47,73,100` |
| F-020 | P2 | Observability | `POST /api/ai/command` membuang detail error tanpa logging | `src/app/api/ai/command/route.ts:16-18` |
| F-021 | P2 | Repository hygiene | `prisma/dev.db` ikut ter-commit di git (binary churn; material lokal) | `.gitignore` |
| F-022 | P3 | UI | Tidak ada loading state halaman; beberapa tombol reorder/a11y minor | menyebar |

---

## B. Detail temuan P0 & P1

### F-001 — P0 · AUTH_SECRET fallback publik → token forgeable

- **Lokasi**: `src/lib/auth.ts:8-10`
  ```ts
  function secret() {
    return process.env.AUTH_SECRET ?? "development-only-change-me";
  }
  ```
- **Masalah**: token sesi = `HMAC-SHA256(secret, "<userId>.<expiry>")` (`tokenFor`), dan `verify` mempercayai signature ini. Karena secret adalah konstanta publik yang diketahui, **siapa pun dapat menandatangani token untuk userId mana pun** (`userId "<uuid>.expires"` apa saja) → membajak sesi user mana pun.
- **Eksploitasi**: `signature("victim-id.1234567890")` dengan secret publik → kirim cookie `ppos_session=<token>.` → API menerima sebagai user korban (verifikasi `expiry` memakai timestamp saat ini, mudah diatur).
- **Perbaikan**: hapus fallback; wajibkan `AUTH_SECRET`; jika tidak ada di production → **gagal-keras** (throw). Untuk non-production, alternatif secret ephemeral per-proses (tidak pernah konstanta publik). Tambahkan nilai dev ke `.env` (git-ignored) + `.env.example`.

### F-002 — P0 · AUTH_ACCESS_CODE fallback publik + pre-fill

- **Lokasi**: `src/app/api/auth/login/route.ts:9`, `src/app/components/LoginForm.tsx:49`
  ```ts
  const expected = process.env.AUTH_ACCESS_CODE ?? "development-access-code";
  ```
  ```tsx
  <input ... defaultValue="development-access-code" ... />
  ```
- **Masalah**: siapa pun yang membuka halaman login menemukan kode akses terisi/dapat ditebak → satu-satunya gerbang otentikasi produktif terbuka.
- **Perbaikan**: hapus fallback; jika kosong → respons error konfigurasi (tidak pernah fallback aman). Hilangkan `defaultValue`. Bandingkan secara constant-time; tambah pembatasan laju percobaan.

### F-003 — P1 · Konfirmasi tulis AI dapat dilewati (client-trustable)

- **Lokasi**: `src/ai/safety.ts:7-8`, `src/schemas/ai-command.schema.ts:13`, `src/services/ai-command.service.ts:43-53`
  - `canWrite(confidence, confirmed)` hanya membaca `confirmed` yang dikirim client.
  - Alur saat ini: response `CONFIRMATION_REQUIRED` menginstruksikan "Kirim ulang dengan confirmed=true" — pesan ini justru mengajari mem-bypass konfirmasi; tidak ada pembuktian bahwa pengguna benar-benar menyetujui intent yang sama.
- **Dampak**: request API langsung dengan `confirmed: true` (mis. `POST /api/ai/command` body `{text:"selesaikan task X", confirmed:true}`) mengeksekusi penulisan tanpa konfirmasi apa pun dari sisi server; semua penulisan AI berpotensi siluman.
- **Perbaikan**: pertahankan semantik "konfirmasi = jalur aman". Terbitkan **one-time confirmation token** (HMAC-bound ke intent + masa berlaku pendek) pada respons `CONFIRMATION_REQUIRED`. Penulisan hanya dieksekusi bila `confirmed=true` **dan** token valid (intent cocok, belum kedaluwarsa). Client UI mengirim balik token; pesan tidak lagi mengajari `confirmed=true` polos.

### F-004 — P1 · Delete tidak diskoping userId di 4 repository

- **Lokasi**:
  - `src/repositories/goal.repository.ts:11` `prisma.goal.delete({ where: { id } })`
  - `src/repositories/stage.repository.ts:12` `prisma.stage.delete({ where: { id } })`
  - `src/repositories/session.repository.ts:80` `deleteSessionById(id)` → `session.delete({where:{id}})`
  - `src/repositories/today.repository.ts:46` `deleteCaptureById(id)` → `capture.delete({where:{id}})`
- **Masalah**: pre-check di service (`findX(owner,id)`) mengurangi risiko, tetapi: (a) setiap `delete` tanpa `userId` di where = satu baris data dari **user lain** bisa terhapus jika pre-check dilewati/lupa di pemanggil baru; (b) check-then-act tidak atomik. Prinsip "defense in depth" dilanggar di titik paling sensitif (penghapusan permanen).
- **Perbaikan**: ganti dengan `deleteMany({ where: { id, userId } })` dan periksa `count`. Jika `count === 0` → service tetap melempar 404 (kontrak API tidak berubah). `deleteTask`/`updateStage`/`updateFocus` sudah memakai pola ini (contoh baik).

### F-005 — P1 · Race & multi-active session (per-task guard saja)

- **Lokasi**: `src/services/session.service.ts:31-52`
- **Masalah**: guard `findActiveSessionByTaskId` hanya mengecek **task yang sama**. Dua permintaan paralel, atau buka sesi task B saat task A masih aktif, menghasilkan **banyak sesi aktif**. `getAnyActiveSession` mengembalikan yang terbaru `orderBy startedAt desc`; AI `SESSION_END` mengakhiri "sesi pertama terbaru" yang mungkin bukan yang dimaksud pengguna. Data integrity & UX rusak (durasi fokus salah).
- **Perbaikan**: (a) tambah guard **global**: hanya satu sesi aktif per user (`findAnyActiveSession`) dengan pesan jelas "Akhiri sesi aktif dahulu"; (b) bungkus check+create dalam transaksi agar atomik.

### F-006 — P1 · Updating actualHours tidak atomik

- **Lokasi**: `src/services/session.service.ts:70-76`
- **Masalah**: `sumCompletedSessionMinutes` lalu `task.update` terpisah → dua request concurrent bisa menimpa `actualHours` dengan nilai basi.
- **Perbaikan**: satukan aggregate+update ke dalam satu `prisma.$transaction` di repository (`recomputeTaskActualHours`).

### F-007 — P1 · 401 menjadi 500 + pola error string rapuh

- **Lokasi terbukti 500 saat unauthenticated**:
  - `src/app/api/sessions/[id]/route.ts:10-12` (DELETE → `handleSessionError`)
  - `src/app/api/goals/[id]/reviews/route.ts:14-15` (GET → `errorResponse`)
  - `src/app/api/tasks/[id]/route.ts:26-28` (PATCH → `serviceErrorResponse`)
- **Pola rapuh yang tersebar** (`error.message === "Autentikasi diperlukan."`): `tasks/[id]`, `sessions/[id]/end`, `tasks/[id]/sessions`, `today/focus/[id]`, `analytics`, `goals`.
- **Dampak**: client (panel AI dll) tidak dapat membedakan "harus login" dari "server rusak"; retry loop tak berguna; log penuh 500 palsu.
- **Perbaikan**: standarkan penanganan `AuthorizationError` via `instanceof AuthorizationError` → `authErrorResponse`. PATCH hide dari services (mis. tidak temukan → 404) tetap berlaku.

### F-008 — P1 · Test HTTP menyentuh DB dev asli

- **Lokasi**: `src/lib/prisma.ts:8-10` (`url: "./prisma/dev.db"` hardcoded); `vitest.config.ts` tanpa isolasi; `tests/idor.http.integration.test.ts` import nyata `prisma`.
- **Dampak**: test integrasi memakai database yang sama dengan dev server → row sampah menyebar saat `npm run dev`; merusak data dev (hapus/ubuat). Build/dev yang sedang berjalan juga bisa tabrakan.
- **Perbaikan**: DB path dibaca dari `DATABASE_URL` (env) → vitest memakai database SQLite sementara (temp file + `migrate deploy` di bootstrap). Secret/kode akses test disuntikkan lewat `test.env`.

### F-009 — P1 · Alur auth & AI write tidak cukup dites

- **Kondisi**: `tests/idor.security.test.ts` hanya memverifikasi ownership `task.service`; `idor.http.integration.test.ts` menguji lintas-user di sebagian endpoint. **Tidak ada** test untuk: round-trip login/logout/me, cookie kedaluwarsa, cookie di-tamper, penolakan `confirmed:true` tanpa token AI, penghapusan scoped (goal/stage/session/capture) lintas-user di level HTTP, guard satu-sesi-aktif.
- **Perbaikan**: tambah berkas test (auth flow unit + AI confirmation + endpoint DELETE lintas-user).

---

## C. Kesesuaian baseline (pra-fix)

- `npx tsc --noEmit` → bersih
- `npm run lint` → bersih
- `npm run test` → 15 file / 115 test lulus
- `npm run build` → sukses
- `python -m unittest discover -s nlp -p "test_*.py" -v` → belum dijalankan ulang pada fase ini (akan diverifikasi pasca-fix)
- `npx prisma validate` / `npx prisma migrate status` → akan diverifikasi pasca-fix

---

## D. Keputusan scope

- **JANGAN** mengubah model entity/schema (tidak ada Milestone; hierarki Goal/Stage/Task/Session + DailyFocus/Review/Capture dipertahankan).
- UI/domain/AI semantics dipertahankan (lock fase 16): perbaikan error/internal hanya mengubah respons kegagalan, bukan tampilan sukses.
- Perbaikan F-021 (hapus `dev.db` dari git) **tidak** dilakukan atas pengubahan repo (Tambah pola `.gitignore` saja); didokumentasikan.
- Temuan P3 & beberapa P2 (indexes DB, CI workflow, NLP skip-guard, loading.tsx global) dianggap **batasan dokumentasi** dan ditulis sebagai "remaining recommendations" pada laporan akhir jika tidak dikerjakan.

## E. Urutan perbaikan

1. F-001, F-002 (auth fail-closed + bump env) — P0
2. F-003 (AI confirmation token) — P1
3. F-004 (scoped deletes) — P1
4. F-005, F-006 (session guard + transaction) — P1
5. F-008, F-009 (test isolation + security tests) — P1
6. F-007, F-010, F-011 (auth errors, rate limit, ownership) — P1/P2 wajib-fase
7. F-012..F-017 (UX/a11y cepat & aman)
8. Verifikasi lengkap + PHASE_17_FINAL_REPORT.md