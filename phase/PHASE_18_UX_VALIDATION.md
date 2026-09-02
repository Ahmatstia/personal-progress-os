# Phase 18 — Real User Testing & Product Validation

> Bahasa dokumen: Indonesia · Sudut pandang reviewer: pengguna baru, tanpa instruksi
> Status: **SELESAI** · Baseline regression: 134/134 test lulus · Prisma valid · build OK · NLP OK

---

## 1. Executive Summary

Personal Progress OS diuji sebagai produk nyata dari sudut pandang pengguna pertama kali,
dengan mandat **audit-first**: tidak ada perubahan kode sebelum observasi, dan UI design system
dari Phase 16 tetap **locked**. Semua halaman, komponen, service, dan route API telah dibaca dan
diwalk-through (Flow 1–9, IA, kognitif, friction, feedback, empty state, error state, mobile,
aksesibilitas, koherensi, dan AI).

Hasil inti:

- **Mental model inti (Goal → Stage → Task → Session) dan siklus ORIENT → DECIDE → DO → REVIEW → IMPROVE
  terbukti koheren** dan terlacak end-to-end di antarmuka.
- Ditemukan **4 masalah yang berhak diperbaiki tanpa mengubah identitas visual**, semuanya sudah
  diterapkan dan lolos regression penuh:
  1. Halaman Hari Ini mengabaikan ranking "aksi berikutnya" (bisa bertentangan dengan Dashboard).
  2. Kartu sesi di Hari Ini menampilkan CTA yang gagal saat belum ada task sama sekali.
  3. AI write command tanpa nama task ("selesaikan tugas") berujung dead-end.
  4. Setelah membuat goal, pengguna tidak diarahkan ke langkah berikutnya.
- **7 catatan lain** diklasifikasikan UX-LOW/UX-MEDIUM dan **di-defer atau dipertahankan** (bukan
  redesign, bukan perombakan copy global).
- Penilaian akhir: **GOOD**, dengan detail nilai 1–10 per 13 dimensi pada bagian 21.

---

## 2. Metodologi

1. **Audit sumber (read-only):** seluruh halaman `(app)/`, semua komponen (shell, core, form, AI,
   ui), service (today, dashboard, progress, review, analytics, ai-command, ai), module AI
   (router, intents, corpus, safety, command-types), route API, dan schema/form validation.
2. **Walkthrough naratif dari sudut pandang pengguna baru** tanpa instruksi (simulasi klik-klik
   di-head). Tidak ada sesi browser fisik; evaluasi berbasis inspeksi deterministik perilaku
   server-rendered + client component.
3. **Validasi silang konsistensi**: aturan penamaan, urutan data, tombol yang sama dipakai di
   banyak halaman, dan sumber tunggal keputusan (ranking).
4. **Klasifikasi temuan** (18L) dan **keputusan fix** (18M) sebelum menyentuh kode.
5. **Implementasi** (18N) hanya untuk masalah yang berdampak fungsional/usabilitas nyata.
6. **Regression penuh** (18O).
7. **Dokumentasi + skoring** (18P).

---

## 3. Profil Pengguna & Skenario

- **Profil:** pengguna perorangan, aplikasi privat (login kode akses + email), baru pertama kali.
- **Skenario inti** yang diuji:
  - Masuk dan memahami apa yang bisa dilakukan.
  - Membuat goal → membuat stage → membuat task.
  - Menjawab "hari ini saya harus mengerjakan apa?" → memulai sesi fokus → menyelesaikannya.
  - Memahami progres (Dashboard), mengisi review mingguan.
  - Menggunakan asisten AI untuk pembacaan dan perubahan data.

---

## 4. First-Time User Test (18A — Flow 1–2)

### Flow 1 — Masuk (Login)

- Halaman `/` = layar login bila belum ada sesi: brand, "Selamat datang kembali", field Email
  (wajib), Nama (opsional), Kode akses (wajib, ada toggle tampilkan), tombol Masuk.
- Validasi: email + kode access code wajib; error ditampilkan inline dari respons API;
  submit loading state; sukses → reload → masuk shell.
- **Catalan:** heading "Selamat datang kembali" untuk kunjungan pertama terasa seperti pengguna
  lama → UX-LOW, di-defer (aplikasi privat, skenario utama memang pengguna kembali).

### Flow 2 — Membuat goal pertama

- Halaman Goals kosong menjelaskan **kenapa** (belum ada), **apa yang harus dilakukan**
  (buat goal), dan menyediakan CTA. Deskripsi empty state juga menjelaskan pemecahan
  goal → stage → task.
- Dialog "Buat goal baru" sederhana: Nama (placeholder contoh), Tipe (6 pilihan), Deskripsi.
- **Sebelum fix:** usai submit pengguna kembali ke list dengan toast "Goal dibuat." — langkah
  berikut (menambah stage) tidak difokuskan.
- **Sesudah fix:** `NewGoalButton` kini langsung `router.push` ke halaman detail goal,
  yang langsung menampilkan CTA "Tambah stage". Alur on-boarding lebih rapat.
- Sudut pandang "apa hasilnya?" jelas: goal baru muncul, toast sukses, halaman berikutnya
  menuntun ke tahap berikut.

---

## 5. Core User Flows (18A — Flow 3–9)

### Flow 3 — Membuat stage

- Detail goal: kartu header (progress ring, statistik), section Roadmap.
  Jika belum ada stage → EmptyState "Belum ada stage" + tombol aksi "Tambah stage" +
  penjelasan singkat. Konsisten dan menuntun.
- Dialog StageForm mengulang definisi: *"Stage adalah bagian bermakna dari perjalanan goal."*
  Yang membedakan stage vs task tetap dipertahankan sesuai mandat.
- Reorder stage (panah atas/bawah), edit, hapus (konfirmasi) berfungsi.

### Flow 4 — Membuat task

- Di dalam stage: tombol dashed "Task baru". Form memuat Nama (wajib, autofokus),
  Deskripsi, Prioritas (Rendah/Sedang/Tinggi), Estimasi jam, Catatan — 5 field, terukur.
  Tidak ada field due date karena domain model tidak memilikinya (hanya deadline di level goal).
- Toast sukses "Task ditambahkan." + task langsung tampil di list.

### Flow 5 — Hari Ini (orientasi + keputusan)

- Header menampilkan tanggal penuh; `NextActionCard` di posisi teratas menjawab
  "Kerjakan ini berikutnya" termasuk konteks goal · stage.
- **Sebelum fix:** kartu ini diambil dari `availableTasks[0]` (urutan goal, bukan ranking) →
  bisa menyarankan task prioritas rendah padahal ada task prioritas tinggi yang belum mulai,
  bertentangan dengan Dashboard. **Sesudah fix:** memakai `today.nextAction` =
  `selectNextAction()` yang sama dengan Dashboard (IN_PROGRESS → prioritas → estimasi → created).
- FocusPanel: atur task "fokus hari ini" (tambah, urutkan, hapus, selesai).
- Statistik 3 kartu (Belajar / Fokus selesai / Task selesai).

### Flow 6 — Sesi fokus

- **Sebelum fix:** saat tidak ada task sama sekali, kartu sesi menampilkan tombol "Mulai sesi"
  yang memanggil `/api/tasks//sessions` (task id kosong) → error; teks "task berikutnya Anda"
  menyesatkan. **Sesudah fix:** kartu idle menampilkan arahan "Belum ada task untuk sesi fokus.
  Buat task lewat Goals." dan tidak lagi menjalankan CTA yang pasti gagal.
- Saat ada task: idle → tombol Mulai sesi (konfirmasi dialog native, sama dengan pola logout &
  hapus) → mode fokus dengan timer besar, tombol pause "Selesaikan sesi" → panel refleksi
  inline (Aktivitas, Apa yang sulit, Aksi berikutnya, Pemahaman 1–5) → simpan / lanjutkan /
  batalkan. Refleksi ditangkap TANPA meninggalkan halaman — kekuatan produk.
- Mulai sesi otomatis menandai task IN_PROGRESS & mengatur `startedAt` (konsisten dengan tombol
  "Mulai kerjakan" di detail task).

### Flow 7 — Dashboard

- `NextActionCard` (ranking sama dengan Hari Ini) → snapshot (Fokus / Task selesai /
  Penyelesaian / Konsistensi) → AICommandPanel tersemat → BottleneckInsight (task penghambat
  dengan badge severity + tombol "Lihat task") → Tren aktivitas 14 hari (dua bar fokus & task) →
  Konsistensi mingguan → Aktivitas terbaru → Sesi terbaru. Semua label penjelas tersedia.

### Flow 8 — Review

- Halaman "Berhenti dan renungkan"  memisahkan diri dari Dashboard: Dashboard = angka,
  Review = refleksi berkala. Kartu periode minggu ini + progres tiap goal + tombol "Tulis review"
  per goal → ReviewForm (waktu, task selesai, pemahaman 1–5, 4 textarea umpan balik).
- Ada kartu penjelasan "Mengapa review mingguan?" → pembelajaran/retensi.
- Riwayat review per goal di `goals/[id]/reviews` (timeline + data yang direview).

### Flow 9 — AI Assistant

- Empat pintu masuk: panel tersemat di Dashboard, tombol header (℞ mengambang) untuk drawer,
  shortcut ⌘K, dan tombol "Asisten" di navigasi bawah mobile. Ter-discover.
- Contoh perintah tersedia ("Coba contoh"), termasuk "selesaikan tugas React".
- Read command → badge intent + data dengan link. Write command → wajib konfirmasi
  (AIConfirmation menampilkan "Ini akan mengubah…") dengan token confirmation per intent.
- Ambigu → AIAmbiguousSelector (daftar pilihan) → pilih → dieksekusi dengan token.
- Failure states: unauth, invalid input, internal error, low confidence → pesan jelas + retry.

---

## 6. Information Architecture (18B)

| Aspek | Temuan | Verdict |
| --- | --- | --- |
| Navigasi utama | Sidebar 5 seksi: Beranda · Hari Ini · Goals · Dashboard · Refleksi; konsisten di desktop; bottom nav 6 item (5 + Asisten) di mobile | Koheren |
| Priortas waktu | Hari Ini = ORIENT + DECIDE; Dashboard = REVIEW (angka) | Tegas terpisah |
| Label konsisten | "Stage", "task", "sesi fokus", "fokus hari ini" dipakai sama di semua halaman/form | Konsisten |
| Satu sumber keputusan | `selectNextAction()` dipakai Home, Dashboard, dan kini Hari Ini | Konsisten (fix) |
| Pemetaan ORIENT→IMPROVE | Semua siklus punya halaman + CTA lanjutan | Lengkap |

---

## 7. Cognitive Load (18C)

- **Baik:** memsetiap layar punya 1–2 CTA utama; form dipecah per entitas; hierarki visual jelas
  (eyebrow → judul → deskripsi).
- **Ringan:** TaskForm 5 field dan ReviewForm 4 textarea — dapat diterima karena setiap field
  berdampak langsung pada data yang ditampilkan (estimasi → progress relay; refleksi → review).
- **Mitigasi tidak perlu:** konsep Stage dijelaskan berulang (form + empty state + tutorial
  sampel) sehingga tidak ada asumsi baru tersembunyi.

---

## 8. Friction & Efficiency (18D)

- **Fix (Hari Ini):** jawaban "kerjakan apa sekarang" kini memakai ranking. Efisiensi keputusan
  meningkat dan tidak lagi bertentangan dengan Dashboard.
- **Sisa friction kecil (defer):** ikon aksi stage/task hanya icon (ada aria-label); tombol
  reorder fokus hanya panah; native `confirm()` di beberapa titik (konsisten satu gaya).
- **Positif:** hampir semua mutasi memberi toast sukses + `router.refresh()`; tidak ada scroll,
  interaksi inline (refleksi sesi) tanpa navigasi.

---

## 9. Feedback & Confirmation (18E)

- Mutasi: toast sukses/gagal, tombol loading state, error inline.
- Aksi destruktif: konfirmasi (native confirm / dialog khusus seperti hapus goal), tanpa
  "undo" — dapat diterima untuk data pribadi bila ada konfirmasi yang jelas.
- Sesi & AI: confirmation yang kuat (mode fokus, panel konfirmasi write command).
- **Keputusan:** tidak menambah dialog kustom untuk menggantikan `confirm()` native —
  perubahan estetika tanpa manfaat fungsional yang jelas (di-defer per mandat anti-churn).

---

## 10. Empty States (18F)

- Goals: kosong → jelaskan + CTA buat goal.
- Detail goal: tidak ada stage → jelaskan + CTA tambah stage. Tidak ada task di stage →
  dashed "Task baru".
- Hari Ini: tanpa aktivitas → kalimat penjelas ringan.
- Dashboard: tanpa aktivitas/sesi → teks penjelas; BottleneckInsight tanpa hambatan →
  panel hijau "Tidak ada hambatan terdeteksi" (umpan balik positif).
- Review: tanpa apa pun → jelaskan syarat; riwayat → empty friendly.
- **Bukan masalah:** semua empty state menghindari kebuntuan.

---

## 11. Error States (18G)

- Error boundary `(app)/error.tsx` menampilkan "Halaman gagal dimuat" + hint (sesi berakhir/data
  tidak ada) + tombol **Coba lagi** dan **Kembali ke beranda**. `not-found.tsx` untuk 404.
- API memakai pola seragam: `{ success, error: { code, message } }`, mapping status
  (404 task, 409 conflict, 422 validasi). Klien menerjemahkan ke toast/inline.
- **Defisit kecil (defer):** deep-link tanpa sesi (mis. `/today` langsung) → error generik,
  bukan redirect ke login. Bila di-improve: cara termudah adalah pesan error yang lebih spesifik
  atau redirect di layout setelah kegagalan authorization. Bukan bug fungsional (ada 2 tombol
  pemulihan).

---

## 12. Mobile Usability (18H)

- Layout: breakpoint `lg:`; grid JS 2 kolom drop ke 1 kolom; bottom nav tetap terlihat;
  Drawer AI full-overlay dari atas dengan panel yang sama.
- Timer sesi memakai `font-mono text-6xl/7xl` → tetap terbaca di layar kecil.
- Dialog `sheet` dari bawah pada mobile (`sm:items-end`) — thumb-friendly.
- Form fields `w-full` + `resize-none` → tidak meluber.
- **Catatan:** bottom nav 6 item menyempit namun ikon+label ada; tidak ada elemen yang
  terpotong pada inspeksi kelas responsif.

---

## 13. Accessibility (18I)

- Semua tombol ikon punya aria-label (hapus, edit, reorder, logout, dsb).
- Selector "Pemahaman 1–5" memakai `aria-pressed` + `aria-label` per tombol.
- Drawer: Escape menutup, ⌘K membuka, `aria-label` pada trigger AI.
- Focus style terlihat (ring/focus boorder) pada input, button, select.
- `aria-hidden` pada ikon dekoratif; heading hierarki `h1→h2` rapi.
- **Batasan evaluasi yang dicatat:** tidak ada audit browser/screen-reader langsung (skor
  moderat + catatan), hanya inspeksi kode.

---

## 14. Product Coherence (18J)

- **Model mental utuh:** Goal → Stage → Task → Session dengan DailyFocus, Review, Capture,
  User, dan AI Assistant sebagai lapisan melintang.
- Dataset `seed` (goal "Belajar AI / Machine Learning" + stage "Phase 0 — Fundamental" + 3
  task konsep) membuat halaman Goals/Detail langsung hidup saat mencoba untuk evaluasi awal;
  sisanya (sesi, review, capture) dibuat lewat interaksi nyata.
- Navigasi, terminologi, empty state, error handling, dan estetika konsisten di semua halaman.
- Tidak ada fitur "yatim" di antarmuka (ProgressPath komponen cadangan tidak dipakai — aman,
  tidak diekspos).

---

## 15. AI Assistant UX (18K)

- Interpretasi yang dapat diumumkan: badge intent + confidence; hasil read menampilkan data
  aktual (task, session, goal) dengan link.
- Confirm sebelum mutasi memakai token bertangkai intent (anti replay) di dua arah: tombol +
  re-parse ulang.
- **Fix:** write command tanpa nama task tidak lagi dead-end:
  - "selesaikan tugas" → daftar task BELUM selesai sebagai pilihan.
  - "buka kembali [task]" → daftar task yang SUDAH selesai.
  - "mulai sesi", "tambahkan X ke fokus" → daftar kandidat.
- Satu task tersisa → langsung dieksekusi (setelah konfirmasi). Ambigu >1 → picker.
- Contoh di panel mencakup kasus yang diperbaiki ("selesaikan tugas React").

---

## 16. Findings Classification (18L)

| Kode | Temuan | Kelas |
| --- | --- | --- |
| F-18-01 | Hari Ini mengabaikan ranking "aksi berikutnya" (bisa kontradiktif dengan Dashboard) | **UX-HIGH** |
| F-18-02 | Kartu sesi idle tanpa task → CTA `Mulai sesi` pasti gagal (taskId kosong) + teks menyesatkan | **UX-HIGH** |
| F-18-03 | AI "selesaikan tugas" (tanpa nama task) → dead-end TASK_NOT_FOUND, padahal contoh resmi | **UX-HIGH** |
| F-18-04 | Setelah goal dibuat, tidak diarahkan ke langkah berikutnya (stage) | **UX-MEDIUM** |
| F-18-05 | Deep-link tanpa sesi → error generik, bukan redirect login | UX-MEDIUM |
| F-18-06 | `window.confirm` native vs Dialog kustom | UX-LOW |
| F-18-07 | "Ke Hari Ini" di kartu kosong adalah rujukan-diri saat berada di /today | UX-LOW |
| F-18-08 | Heading "Selamat datang kembali" pada pengguna pertama | UX-LOW |
| F-18-09 | Tidak ada due date di TaskForm (domain hanya punya deadline goal) | NO-ACTION |
| F-18-10 | Dua "Mulai" (status vs sesi) di task page | UX-LOW (konvergen) |
| F-18-11 | Campuran bahasa task/goal/stage vs Indonesia | NO-ACTION (konsisten) |
| F-18-12 | FocusPanel: select "Tambah" nonaktif tanpa teks bila tidak ada task | UX-LOW |
| F-18-13 | Flash tanpa shell saat unauth deep-link | NO-ACTION |
| F-18-14 | 4 pintu AI entry point (padat di mobile) | UX-LOW |
| F-18-15 | Review guidance tanpa data konteks | NO-ACTION |
| F-18-16 | Bottom nav 6 item | UX-LOW |
| F-18-17 | Aksesibilitas (label/pressed/focus) sudah terpasang | NO-ACTION |
| F-18-18 | Banner review hanya goal pertama di Dashboard | NO-ACTION |

Rekap: **UX-CRITICAL: 0 · UX-HIGH: 3 · UX-MEDIUM: 2 · UX-LOW: 7 · NO-ACTION: 6**

---

## 17. Fix Decisions (18M)

| Kode | Keputusan | Alasan |
| --- | --- | --- |
| F-18-01 | **FIX NOW** | Jawaban inti halaman kunci; perbaikan kecil, sumber ranking tunggal |
| F-18-02 | **FIX NOW** | CTA yang pasti gagal = bug fungsional di state valid |
| F-18-03 | **FIX NOW** | Dead-end pada contoh resmi AI; perbaikan terisolasi di service |
| F-18-04 | **FIX NOW** | Win on-boarding, perubahan navigasi minimal |
| F-18-05 | DEFER | Ada pemulihan; butuh desain global redirect |
| F-18-06 | DEFER (KEEP) | Konsisten; tanpa manfaat fungsional, hindari churn visual |
| F-18-07 | DEFER | Friction sangat kecil; perlu prop tambahan di komponen bersama |
| F-18-08 | DEFER | Skenario utama = pengguna kembali (app privat) |
| F-18-09..18 | KEEP / NO-ACTION | Konsisten dengan mandat Phase 16 & tanpa dampak |

---

## 18. Changes Implemented (18N)

1. **`src/services/today.service.ts`** — cabang active-session pada `nextAction` kini membawa
   metadata lengkap (goalId, goalName, stageName, priority, estimated*, status, startedAt)
   sehingga konsumen mendapat bentuk yang sama dengan `selectNextAction`.
2. **`src/app/(app)/today/page.tsx`** — `nextActionCard` (dan fallback `sessionTask`) dibangun
   dari `today.nextAction` (ranking resmi) menggantikan `availableTasks[0]`; menghapus
   `firstAvailable`.
3. **`src/app/components/core/SessionFocusMode.tsx`** — saat `taskId` kosong, kartu idle
   menampilkan arahan "Belum ada task untuk sesi fokus. Buat task lewat Goals." (link ke /goals)
   dan **tidak** merender tombol "Mulai sesi" yang mustahil bekerja.
4. **`src/services/ai-command.service.ts`** — helper `resolveWriteTarget`: bila write command
   (TASK_COMPLETE/TASK_REOPEN/SESSION_START/FOCUS) tidak menyebut task, mengembalikan daftar
   kandidat yang relevan (belum selesai / sudah selesai untuk reopen) → dialihkan ke mekanisme
   AMBIGUOUS_TASK (picker) bila >1, langsung eksekusi bila tepat 1. Perilaku dengan nama task
   eksplisit tidak berubah.
5. **`src/app/components/NewGoalButton.tsx`** — setelah goal dibuat: `router.push('/goals/{id}')`
   (route POST `/api/goals` mengembalikan entitas goal ber-`id`).

Perubahan bersifat aditif/korektif; **tidak ada redesign, tidak ada perubahan domain model,
tidak ada tes yang dihapus.**

---

## 19. Deferred & Rejected

- **Deferred (produk OK, dampak rendah):** redirect/login khusus unauth deep-link (F-18-05);
  mengganti semua `confirm()` native dengan dialog kustom (F-18-06); menghapus rujukan-diri
  "Ke Hari Ini" di /today (F-18-07); heading login untuk pengguna pertama (F-18-08);
  teks kosong select fokus (F-18-12).
- **Ditolak (per mandat):** penambahan due date per task (domain tidak berubah); renaming
  global Stage/task (design system locked); pembuatan Milestone entity (di luar scope);
  smoothing skor visual dashboard (tanpa bukti masalah).

---

## 20. Regression Verification (18O)

| Check | Perintah | Hasil |
| --- | --- | --- |
| TypeScript | `npx tsc --noEmit` | OK (0 error) |
| Lint | `npm run lint` | OK (0 masalah) |
| Unit/integration (Vitest) | `npm run test` | **16 file / 134 test PASS** (tidak berkurang) |
| Build produksi | `npm run build` | OK (route map lengkap) |
| Schema | `npx prisma validate` | schema valid ✅ |
| Migrasi | `npx prisma migrate status` | up to date (3 migrasi) |
| NLP pipeline | `python -m unittest discover -s nlp -p "test_*.py" -v` | 11 test OK (baseline model) |

Catatan: warning Vite `configLoader` dan notice prisma update bersifat non-blokir (tidak berubah).

---

## 21. Final Product Assessment

### Nilai 1–10 (13 dimensi)

| Dimensi | Skor | Catatan |
| --- | --- | --- |
| Learnability | 8 | Empty state + penjelasan tiap langkah; sedikit label generik yang diringankan |
| Navigation clarity | 9 | Sidebar 5 seksi, bottom nav, label konsisten, breadcrumb-back |
| Task completion clarity | 9 | Setup goal→stage→task → Decisions; CTA selalu jelas |
| Goal management | 8 | Progress, stage breakdown, reorder, estimasi, url stage anchor |
| Today usability | 8 | Fokus hari ini + aksi berikutnya (ranking) + statistik; ikon reorder masih polos |
| Session usability | 8 | Timer, cancel, refleksi inline; empty-task diperbaiki |
| Dashboard usefulness | 8 | Snapshot/bottleneck/trends/konsistensi/aktivitas |
| Review usefulness | 8 | Data mingguan + refleksi + sejarah; pemisahan dari dashboard jelas |
| AI usability | 8 | Contoh, konfirmasi, picker ambigu; beberapa intent belum punya data view lengkap |
| Error recovery | 7 | Toast/inline solid; deep-link unauth masih generik (defer) |
| Mobile usability | 8 | Navigasi bawah & drawer; bottom nav padat |
| Accessibility | 8 | Aria-label/focus/pressed ada; belum ada uji screen-reader langsung |
| Product coherence | 9 | Satu model mental, satu ranking, terminologi konsisten, siklus utuh |

### Penilaian keseluruhan

**GOOD** — seluruh siklus inti berfungsi end-to-end tanpa kebuntuan; masalah UX-HIGH sudah
diperbaiki; sisa temuan bersifat polish (defer) dan bukan redesign.

### Jawaban atas pertanyaan produk

> Dapatkah pengguna baru, tanpa instruksi apa pun: membuat goal → membuat stage → membuat task →
> memutuskan apa yang dikerjakan hari ini → menjalankan sesi fokus → menyelesaikan task →
> memahami progres → melakukan review → (opsional) memakai AI?

**Ya.** Alurnya terverifikasi:

1. Login `/` → sambutan + aksi.
2. Goals (empty state + CTA) → buat goal → **otomatis ke detail** → CTA "Tambah stage".
3. Stage → dashed "Task baru" → isi minimal (nama) → task tampil.
4. `/today` menjawab "Kerjakan ini berikutnya" (ranking konsisten) → fokus hari ini opsional.
5. "Mulai sesi" → timer → refleksi inline → selesai/batalkan.
6. Task bisa ditandai selesai dari kartu/detail; selesai hari ini + statistik ter-update.
7. Dashboard menampilkan progres, hambatan, tren, konsistensi.
8. Review menuntun refleksi mingguan dengan data terukur.
9. AI bisa membaca (status/progress) dan mengubah (selesaikan/await sesi) dengan konfirmasi —
   termasuk contoh tanpa nama task yang kini berujung picker.

Pola pengguna yang benar dapat diselesaikan dari awal sampai akhir tanpa dokumentasi.

**PHASE 18 COMPLETE.**