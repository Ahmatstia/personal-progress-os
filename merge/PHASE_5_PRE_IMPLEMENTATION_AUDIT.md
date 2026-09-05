# PHASE 5 — PRE-IMPLEMENTATION AUDIT
# PROGRESS, FOCUS, CAPTURE & TIME INTEGRATION

**Date:** 2026-09-04  
**Product Identity:** MyLife (Personal Life Operating System)  
**Technical Foundation:** MyProgress  
**Status:** AUDIT COMPLETE — IMPLEMENTATION READY  

---

## 1. Executive Summary & Objective

Tujuan dari **Phase 5** adalah menyatukan entitas eksekusi harian dan waktu ke dalam pengalaman kerja terpadu pada pondasi teknis MyProgress, mencakup:
1. **DailyFocus**: Fokus harian pengguna dengan pemilihan task, tracking progres, dan riwayat.
2. **Session**: Sesi kerja mendalam (deep work/Pomodoro) yang terikat pada aturan ketat: *maksimal 1 sesi aktif per user* (diperkuat oleh PostgreSQL partial unique index `idx_unique_active_session_per_user`).
3. **Review**: Refleksi capaian periodik pengguna terhadap Goal/progres.
4. **Capture**: Alur tangkap cepat (Quick Capture) dengan konversi ke `Task` atau `Goal`, atau diarsipkan/ditutup.
5. **Time / Calendar Integration**: Menghubungkan `CalendarEvent` dengan jadwal kerja harian dan tugas nyata.
6. **Activity Integration**: Pencatatan riwayat histori aktivitas secara otomatis pada saat task/sesi selesai tanpa menduplikasi data Session.
7. **Unified Today Experience**: Halaman `/today` yang fungsional, responsif, dan mencakup aksi cepat eksekusi harian.

Semua implementasi wajib mematuhi arsitektur berlapis:
```
UI → API → Zod → Service → Repository → Prisma → PostgreSQL
```
Serta menjaga fondasi AI dalam status **FROZEN**.

---

## 2. Audit Implementasi Saat Ini

### 2.1. DailyFocus
- **Database Schema**:
  Model `DailyFocus` di PostgreSQL:
  ```prisma
  model DailyFocus {
    id        String   @id @default(cuid())
    userId    String
    date      DateTime
    taskId    String
    order     Int      @default(0)
    createdAt DateTime @default(now())

    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)

    @@unique([userId, date, taskId])
    @@index([userId, date, order])
    @@index([userId, taskId])
  }
  ```
- **Kondisi Eksisting**:
  - Dikelola sebagian di dalam `src/repositories/today.repository.ts` (`findTodayFocus`, `createFocus`, `deleteFocus`, `updateFocus`) dan `src/services/today.service.ts` (`addTodayFocus`, `removeTodayFocus`, `reorderTodayFocus`).
  - API endpoint saat ini: `/api/today/focus` dan `/api/today/focus/[id]`.
- **Gaps & Kebutuhan Phase 5**:
  - Belum ada modul service/repository tersendiri atau dedicated API untuk manipulasi DailyFocus secara umum (termasuk riwayat fokus lintas tanggal).
  - Integrasi task: Task multi-track (Project track, Milestone track, Area track) belum seluruhnya terakomodasi di dalam daftar task yang dapat dipilih untuk fokus harian (saat ini hanya menarik dari `goal.stages.tasks`).
  - Pemilihan task ke dalam DailyFocus harus mendukung seluruh track task yang valid.

### 2.2. Session
- **Database Schema**:
  Model `Session`:
  ```prisma
  model Session {
    id              String    @id @default(cuid())
    userId          String
    taskId          String
    startedAt       DateTime
    endedAt         DateTime?
    durationMinutes Int?
    activity        String?
    understanding   Int?
    obstacle        String?
    nextAction      String?
    createdAt       DateTime  @default(now())

    user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
    task            Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)

    @@index([userId, taskId])
    @@index([userId, startedAt])
    @@index([userId, endedAt])
  }
  ```
  Enforcement Database:
  `idx_unique_active_session_per_user` (UNIQUE `(userId)` WHERE `endedAt IS NULL`).
- **Kondisi Eksisting**:
  - `src/repositories/session.repository.ts` dan `src/services/session.service.ts` sudah menerapkan pre-check dan penanganan konkurensi database (`P2002`).
  - Ditemukan bug minor pada `session.service.ts:125`: `findSessionById(owner, sessionId)` terbalik parameternya terhadap deklarasi `findSessionById(id, userId)` di repository.
  - Endpoints: `POST /api/tasks/[id]/sessions`, `PATCH /api/sessions/[id]/end`, `GET /api/sessions/[id]`.
- **Gaps & Kebutuhan Phase 5**:
  - Menghubungkan penyelesaian sesi dengan pencatatan `Activity` jika durasi kerja bermakna.
  - Memastikan penghitungan `actualHours` pada Task tetap sinkron.
  - Menghindari race condition pada concurrent start request.

### 2.3. Review
- **Database Schema**:
  Model `Review`:
  ```prisma
  model Review {
    id             String   @id @default(cuid())
    userId         String
    goalId         String
    periodStart    DateTime
    periodEnd      DateTime
    learningHours  Float    @default(0.0)
    tasksCompleted Int      @default(0)
    understanding  Float?
    wentWell       String?
    difficulties   String?
    improvements   String?
    nextFocus      String?
    createdAt      DateTime @default(now())

    user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    goal           Goal     @relation(fields: [goalId], references: [id], onDelete: Cascade)

    @@unique([userId, goalId, periodStart, periodEnd])
    @@index([userId, goalId])
    @@index([userId, periodStart])
  }
  ```
- **Kondisi Eksisting**:
  - `src/repositories/review.repository.ts` dan `src/services/review.service.ts` telah berjalan untuk Goal review mingguan.
  - Namun di UI (`src/app/(app)/review/page.tsx`), ditemukan direct call ke `prisma` (`import { prisma } from "@/lib/prisma"`), melanggar aturan arsitektur berlapis (UI memanggil Prisma langsung).
- **Gaps & Kebutuhan Phase 5**:
  - Hapus pemanggilan langsung Prisma di UI `/review`. Pindahkan ke `review.service.ts` dan `review.repository.ts`.
  - Tambahkan fungsi list seluruh review pengguna lintas Goal (`getReviews(userId)`).
  - Buat API endpoint `/api/reviews` untuk listing dan manajemen review independen.

### 2.4. Capture
- **Database Schema**:
  Model `Capture`:
  ```prisma
  model Capture {
    id              String          @id @default(cuid())
    userId          String
    content         String
    status          CaptureStatus   @default(PENDING)
    category        CaptureCategory @default(TASK_CANDIDATE)
    convertedTaskId String?
    convertedGoalId String?
    processedAt     DateTime?
    createdAt       DateTime        @default(now())
    updatedAt       DateTime        @updatedAt

    user            User            @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@index([userId, status])
    @@index([userId, createdAt])
  }
  ```
- **Kondisi Eksisting**:
  - Logika capture saat ini menempel pada `today.repository.ts` (`createCapture`, `findRecentCaptures`, `findCapture`, `deleteCaptureById`) dan `capture.service.ts`.
  - Hanya mendukung penyimpanan teks mentah dan penghapusan catatan.
- **Gaps & Kebutuhan Phase 5**:
  - Buat `capture.repository.ts` dedicated untuk memisahkan domain Capture dari Today.
  - Implementasikan siklus hidup lengkap Capture:
    1. Quick Create (`category`, `content`)
    2. Inbox List & Filter (`PENDING`, `PROCESSED`, `ARCHIVED`)
    3. Update/Edit capture
    4. Convert to Task (`POST /api/captures/[id]/convert-task`) dengan validasi structural parent milik user yang sama.
    5. Convert to Goal (`POST /api/captures/[id]/convert-goal`) dengan relasi Area opsional milik user yang sama.
    6. Dismiss / Archive status.
  - UI Inbox Capture terpadu (`/capture`).

### 2.5. CalendarEvent & Activity Integration
- **Kondisi Eksisting**:
  - Model, repository, service, Zod schema, dan API untuk `CalendarEvent` dan `Activity` telah selesai dibangun dan diuji pada Phase 4 (`tests/phase4.domains.test.ts`).
- **Gaps & Kebutuhan Phase 5**:
  - `CalendarEvent`: Hubungkan event kalender hari ini dengan halaman `/today` (agenda hari ini). Sediakan aksi cepat menjadwalkan task ke kalender.
  - `Activity`: Integrasikan auto-logging activity saat task ditandai selesai (`COMPLETED`) atau saat sesi kerja berakhir dengan catatan kerja.

### 2.6. Today Experience (`/today`)
- **Kondisi Eksisting**:
  - Terdapat `src/app/(app)/today/page.tsx` dengan komponen `FocusPanel`, `DailyQuickStart`, `SessionFocusMode`, `NextActionSpotlight`, `QuickCapture`.
  - Namun context task hari ini saat ini hanya mengambil task dari jalur `goal.stages.tasks`. Task di bawah `Project` atau `Area` langsung tidak muncul.
  - Belum ada visualisasi agenda jadwal kalender hari ini (`CalendarEvent`).
  - Belum ada tombol aksi cepat konversi Capture langsung dari Today.

---

## 3. Keamanan & Ownership (IDOR Prevention)

Semua mutasi dan query wajib menerapkan fail-closed:
1. Identitas `userId` selalu diperoleh dari `requireCurrentUser(request)` atau `requirePageUser()`.
2. Parameter `userId` yang dikirimkan client melalui body/query diabaikan.
3. Validasi parent ID:
   - Konversi Capture ke Task: Memastikan `stageId`, `projectId`, `milestoneId`, `goalId`, atau `areaId` yang disertakan adalah milik authenticated user.
   - Konversi Capture ke Goal: Memastikan `areaId` (jika ada) adalah milik authenticated user.
   - Sesi kerja: Memastikan `taskId` adalah milik authenticated user.
   - Review: Memastikan `goalId` adalah milik authenticated user.
4. Akses lintas user (User B mengakses data User A) harus selalu ditolak dengan HTTP 404 / `NOT_FOUND` tanpa membocorkan eksistensi data.

---

## 4. Analisis Berkas yang Terpengaruh

### Berkas Baru yang Akan Dibuat:
1. `src/schemas/capture.schema.ts` — Skema validasi Zod untuk create, update, convert to task, convert to goal.
2. `src/schemas/daily-focus.schema.ts` — Skema validasi Zod untuk daily focus input/reorder.
3. `src/repositories/capture.repository.ts` — Dedicated query prisma untuk Capture.
4. `src/repositories/daily-focus.repository.ts` — Dedicated query prisma untuk DailyFocus.
5. `src/services/daily-focus.service.ts` — Business logic DailyFocus.
6. `src/app/api/captures/[id]/convert/route.ts` — API endpoint konversi capture ke task/goal.
7. `src/app/api/daily-focus/route.ts` & `src/app/api/daily-focus/[id]/route.ts` — API dedicated daily focus.
8. `src/app/api/reviews/route.ts` — API list & general review retrieval.
9. `src/app/(app)/capture/page.tsx` & `CaptureInboxManager.tsx` — UI Inbox Capture & conversion modal.
10. `tests/phase5.integration.test.ts` — Test suite komprehensif Phase 5.

### Berkas yang Akan Dimodifikasi:
1. `src/repositories/review.repository.ts` — Menambahkan `findAllReviews(userId)`.
2. `src/services/review.service.ts` — Menambahkan `getAllReviews(userId)` dan refactor pemanggilan Prisma dari UI.
3. `src/app/(app)/review/page.tsx` — Menghilangkan direct Prisma access, gunakan service layer.
4. `src/services/capture.service.ts` — Integrasikan convertToTask, convertToGoal, updateCapture, archiveCapture.
5. `src/app/api/captures/route.ts` & `src/app/api/captures/[id]/route.ts` — Dukung update capture dan query inbox.
6. `src/services/session.service.ts` — Perbaiki bug parameter `findSessionById(owner, sessionId)` dan integrasikan auto-record Activity pada sesi yang selesai.
7. `src/services/task.service.ts` — Tambahkan opsi auto-record Activity saat task selesai.
8. `src/services/today.service.ts` — Perbaiki penarikan task agar mencakup seluruh track (Goal, Project, Area).
9. `src/app/(app)/today/page.tsx` — Integrasikan CalendarEvent hari ini, perbaiki integrasi quick actions, dan sinkronkan dengan Task multi-track.
10. `src/app/components/QuickCapture.tsx` — Tingkatkan agar mendukung pilihan kategori dan link ke inbox capture.

---

## 5. Rencana & Urutan Implementasi (Implementation Order)

1. **Langkah 1 — Dedicated DailyFocus Layer**:
   - Buat `daily-focus.schema.ts`, `daily-focus.repository.ts`, `daily-focus.service.ts`, dan API routes `/api/daily-focus`.
   - Update `today.service.ts` agar mendukung multi-track task lookup (Stage, Project, Milestone, Area).

2. **Langkah 2 — Session Solidification & Activity Hook**:
   - Perbaiki bug pemanggilan parameter di `session.service.ts`.
   - Integrasikan penyelesaian sesi bermakna (>1 menit) ke pembuatan rekaman `Activity` otomatis dengan kategori `WORK` atau `LEARNING`.

3. **Langkah 3 — Capture Lifecycle & Conversion Engine**:
   - Buat `capture.schema.ts` (create, update, convert-to-task, convert-to-goal).
   - Buat `capture.repository.ts` dengan dukungan status filter, conversion pointer tracking (`convertedTaskId`, `convertedGoalId`).
   - Kembangkan `capture.service.ts` dengan fungsi `convertToTask` dan `convertToGoal` yang memvalidasi kepemilikan parent secara ketat.
   - Buat endpoint API konversi: `/api/captures/[id]/convert`.

4. **Langkah 4 — Review Architecture Normalization**:
   - Tambahkan `findAllReviews` pada `review.repository.ts` dan `getAllReviews` pada `review.service.ts`.
   - Bersihkan direct Prisma access pada `src/app/(app)/review/page.tsx`.
   - Buat `/api/reviews` route handler.

5. **Langkah 5 — Calendar & Time Integration with Today**:
   - Tambahkan fungsi pengambilan event kalender hari ini pada `today.service.ts` menggunakan `calendar-event.repository.ts`.
   - Integrasikan jadwal ke tampilan `/today`.

6. **Langkah 6 — UI Refinement**:
   - Bangun `/capture` (Inbox Capture dengan alur konversi ke Task/Goal).
   - Perbarui `/today` dengan tampilan terintegrasi (Daily Focus multi-track, Sesi aktif, Calendar Events hari ini, Quick Actions, Quick Capture).
   - Pastikan menu navigasi di Sidebar mencakup link ke Capture Inbox (`/capture`) dan Review (`/review`).

7. **Langkah 7 — Automated Testing**:
   - Tulis `tests/phase5.integration.test.ts` mencakup:
     - DailyFocus CRUD & Multi-track selection.
     - Session concurrency, duration, active limit, IDOR.
     - Capture lifecycle & IDOR parent validation pada convert.
     - Review ownership & listing.
     - Calendar & Activity progress integration.
     - Today composite data integrity & cross-user leak prevention.

8. **Langkah 8 — Quality Gates & Verification**:
   - `npm test` (seluruh 22+ file uji wajib PASS).
   - `npm run typecheck` (0 errors).
   - `npm run lint` (0 errors introduced).
   - `npm run build` (Next.js production build PASS).
   - `npx prisma validate` & `npx prisma migrate status` (DB synchronized).

9. **Langkah 9 — Laporan Akhir**:
   - Tulis `PHASE_5_IMPLEMENTATION_REPORT.md`.

---

## 6. Risiko & Strategi Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Race condition saat start session concurrent | Pelanggaran aturan 1 sesi aktif per user | Pertahankan pre-check service dan tangkap error database constraint `idx_unique_active_session_per_user` (`P2002`). |
| Injeksi parent saat konversi Capture ke Task/Goal | IDOR / Relasi data lintas user | Validasi kepemilikan parent (`goalId`, `projectId`, `stageId`, `areaId`) melalui service sebelum membuat Task/Goal. |
| Perubahan `today.service.ts` mematahkan tes lama | Regresi 209 tes yang sudah lolos | Pertahankan struktur output `getToday()` yang kompatibel ke belakang, tambahkan field baru secara non-breaking. |
| Pelanggaran arsitektur Prisma di UI | Inkonsistensi arsitektur | Pindahkan semua Prisma query di halaman review/today ke service dan repository yang sesuai. |
