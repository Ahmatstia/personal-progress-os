# PHASE — UI/UX Redesign Final Report

**Personal Progress OS — "Calm Progress OS"**
_UI/UX Redesign (presentation only). Functionality, backend, API, database, AI,
authentication, security, and business logic were **not changed**._

---

## 1. Executive Summary

Personal Progress OS diretasain ulang dari tampilan "generic SaaS dashboard"
menjadi **produk interface yang khas ("Calm Progress OS")**: warm-neutral
foundation + primary indigo→violet yang tenang, bahasa visual **Journey Route
+ Focus Orb**, dan komposisi naratif menggantikan grid kartu stat templat.

Pengerjaan berjalan 15 fase (2–16) dengan prinsip eksekusi:

- **Presentation-only.** Tidak ada satu pun perubahan pada prisma, API route,
  services, lib, AI/NLP, auth, workflow, atau tests.
- **Tanpa dependency baru.** Stack tetap: Next.js 16, React 19, Tailwind v4.
- **Verifikasi berlapis** di setiap fase: `tsc`, `eslint`, dan di fase akhir
  seluruh test suite (134/134) + production build.

Keputusan desain yang terkunci (dikonfirmasi user):
1. **Inter** dimuat via `next/font/google` dan dipasang ke `--font-sans`.
2. **Refactor ke primitives** baru diperbolehkan (presentation-only).
3. **Dark mode dilewati** (fokus pada kualitas light theme).
4. **Dialog/Confirm ditingkatkan a11y** (focus trap, restore focus, aria-labelledby).
5. Metafora inti = **Journey Route + Focus Orb** — *visual language*, bukan template layout.

---

## 2. UX Philosophy

Prioritas kegunaan (harus dijaga urutannya):
1. Comprehension — paham apa yang dilihat dalam <3 detik.
2. Navigation — tahu di mana saya berada dan ke mana saya bisa pergi.
3. Action clarity — satu CTA utama per layar yang tidak ambigu.
4. Information hierarchy — angka/fakta literal, tanpa kartu dekoratif.
5. Consistency — satu pola token, eyebrow, ikon-tile, dan elevasi.
6. Accessibility — keyboard, label, kontras, reduced motion.
7. Visual uniqueness — keunikan yang melayani pemahaman.
8. Animation — sesingkat mungkin, hanya orientasi/feedback/continuity.

Aturan tambahan yang diterapkan: **UNIQUE + CLEAR > UNIQUE + CONFUSING**.
Journey Route + Focus Orb dipakai hanya jika menambah pemahaman; bila layout
sederhana lebih jelas, dipakai layout sederhana — tetap memakai
shape/color/typography language yang sama. Informasi tetap **literal**
("Stage 3", "4 task", "Tugas berikutnya: …").

---

## 3. Visual Direction

- **Typography:** Inter (self-host via next/font) dengan `font-feature-settings`
  cv02/cv03/cv04/cv11; `font-sans` di set `--font-inter`.
- **Color:** fondasi warm neutral (surface stone) + **primary indigo→violet**
  ("warna intelejensi") + **AI violet** yang dibedakan dari primary halaman.
- **Elevation:** `--shadow-soft` (default), `--shadow-raised` (hero/aktif),
  `--shadow-pop` (modal).
- **Shape:** rounded-2xl/3xl konsisten; ikon-tile 32px dengan tone per konteks.
- **Micro-label:** satu pola `eyebrow` (11px, 600, 0.16em, uppercase) untuk
  orientasi di seluruh layar.
- **Motion:** ≤ ~250ms; `animate-in-soft` untuk entry; denyut waypoint untuk
  orientasi; sweep orb untuk "waktu berjalan". Semua dinonaktifkan saat
  `prefers-reduced-motion: reduce`.

---

## 4. Signature Components

Tiga+ komponen khas, masing-masing dengan **alasan UX eksplisit**:

### 4.1 `JourneyRoute` (+ `CurrentWaypointTag`)
- **Alasan UX:** menjawab **"WHERE AM I?"**. Stage ditampilkan sebagai waypoint
  di satu rute: dilewati (padat primary), sedang (bercahaya + halo + denyut),
  belum (outline putus-putus). Setiap waypoint membawa nama stage (literal).
- Dipakai di: Goals cards, Goal Detail (peta posisi), dan siap pakai di konteks
  task/today.

### 4.2 `FocusOrb`
- **Alasan UX:** satu angka penting ditampilkan sebagai lingkaran kemajuan —
  tidak ada grid kartu stat. Mode `sweep` (dot berputar) memberi kesan "waktu
  berjalan" pada timer tanpa mengeklaim target durasi (tidak menyesatkan).
- Dipakai: ringkasan dashboard (30 hari), ringkasan beranda, orb timer sesi
  fokus, dan konseks orb pada spotlight aksi berikutnya.

### 4.3 `NextActionSpotlight`
- **Alasan UX:** menjawab **"WHAT NOW?"**. Satu spotlight per halaman (bukan
  katalog card): nama task besar, konteks goal · stage, estimasi waktu literal,
  CTA "Mulai sesi" dan "Buka task". Status "Sesi berlangsung" tampil eksplisit.
- Dipakai di: Beranda, Hari Ini (Today), Dashboard.

### 4.4 Pendukung / AI presence
- `focus-mode-store` (useSyncExternalStore): saat sesi fokus berjalan, shell
  (sidebar/topbar/bottom-nav) memudar — permukaan kerja yang bercahaya.
- Kehadiran AI tetap sebagai **panel kontekstual** per halaman (AICommandPanel),
  bukan chatbot besar di mana-mana; skin sudah selaras dengan token AI violet.

---

## 5. Design System

**Primitives baru** (`src/app/components/ui/`):
- `Card` — permukaan ringan dengan tone (default/subtle/primary/success/warning/ai).
- `SectionHeader` — eyebrow + judul + deskripsi + aksi (icon-tile opsional).
- `Input`, `Textarea`, `Select` — input dengan label/error/hint, focus ring.
- `StatRow` — baris fakta naratif (ikon-tile + label kiri + nilai/hint kanan),
  dt/dd semantik di dalam `<dl>`.
- `SegmentedControl` — pengelompokan pilihan pill.
- `Skeleton` — placeholder shimmer.

Semua primitif memakai token `@theme` yang sama, tanpa dependency baru.

---

## 6. Screen-by-Screen

| Halaman | Perubahan utama |
| --- | --- |
| Beranda `/` | `NextActionSpotlight`; ringkasan dengan **FocusOrb** "progres keseluruhan" + StatRows naratif menggantikan grid ProgressSnapshot; card review/weekly & daftar goals aktif dirapikan. |
| Hari Ini `/today` | Spotlight aksi berikutnya; statistik jadi baris naratif; badge jumlah task selesai; urutan fokus > sesi > catat cepat > selesai > rangkuman. |
| Goals `/goals` | Kartu pertama = **featured waypoint card** (komposisi tidak seragam), sisanya kartu dengan **JourneyRoute** per-stage; penghitung aktif di header. |
| Goal Detail `/goals/[id]` | **Peta "Posisi Anda"** (JourneyRoute), stage saat ini ditandai `SEKARANG` + glow/ring, yang selesai hijau; statistik → StatRows naratif. |
| Task Detail `/tasks/[id]` | Breadcrumb goal · stage; statistik → StatRows (dengan sinyal "melebihi estimasi"); sesi fokus memakai SectionHeader; daftar sesi tetap literal. |
| Sesi Fokus `SessionFocusMode` | Timer besar di dalam **FocusOrb sweep**; layout zen; form tutup sesi memakai `Textarea`; integrasi **focus-mode dim** ke shell; tombol batalkan di pojok; prop `compact` dihapus (tidak terpakai). |
| Dashboard `/dashboard` | Ringkasan 30 hari: **FocusOrb** penyelesaian + narasi; spotlight aksi berikutnya; tren/konsistensi/aktivitas memakai SectionHeader; bottleneck & AI panel tetap. |
| Refleksi `/review` | Struktur hero minggu + daftar review + penjelasan ritual tetap selaras (sudah sesuai system sebelumnya). |
| Pengaturan `/settings` | Statistik akun menjadi **StatRows naratif** (bukan 3 kartu angka). |
| AI layer | Skin tidak diubah fungsional; sudah memakai token AI violet yang konsisten (`AIInput`, `AIResponse`, `AIConfirmation`, `AIAmbiguousSelector`). |

---

## 7. Navigation

Navigasi mengajarkan produk lewat **kata kerja per rute** (route & label asli
tidak berubah):
`Mulai · Start`, `Hari Ini · Do`, `Goals · Plan`, `Dashboard · Progress`,
`Refleksi · Reflect`, `Pengaturan · System`.

- **Sidebar (desktop):** item aktif = indikator waypoint (garis kiri + dot
  berdenyut); verb chip di kanan (aktif = terisi primary).
- **Mobile bottom-nav:** target sentuh ≥48px, `env(safe-area-inset-bottom)`,
  label + indikator dot aktif; tab Asisten AI tetap.
- Saat **mode fokus aktif**, seluruh chrome memudar (transisi 300ms).

---

## 8. Responsive

- Bottom nav mobile: `min-h-[48px]`, safe-area, stretch equal.
- Layout utama memakai grid 1 kolom → 2 kolom di `lg`; kartu featured
  `md:col-span-2`.
- JourneyRoute menyesuaikan lebar (`flex-1` connector, label truncate).
- Input/aksi form membungkus (`flex-col sm:flex-row`) di layar kecil.
- Orb timer 184px & ring summary 92px tetap muat di mobile terkecil.

---

## 9. Accessibility

- **Dialog** — focus trap (Tab/Shift+Tab), fokus awal ke autofocus/input
  pertama/tombol tutup, **fokus dikembalikan ke elemen asal** saat ditutup,
  `aria-labelledby` + `aria-describedby`.
- **GlobalAIDrawer** — Escape + restore focus on close, `aria-modal`.
- Form: `<label>` eksplisit, error/hint `aria-invalid`; tombol ikon semua
  ber-`aria-label`; nav ber-`aria-current` + `aria-label` kelompok.
- Data terstruktur: `<dl>/<dt>/<dd>` untuk StatRow, `role=progressbar` untuk
  ProgressBar, `role=img` + aria-label untuk JourneyRoute/FocusOrb.
- Kontras: teks surface-900/500/400 pada surface-0→50 memenuhi AA; danger/success
  diuji pada chip.
- **Reduced motion:** blok global menghapus animasi/transisi; denyut waypoint
  dimatikan khusus.

---

## 10. Files Changed

**Modified:**
- `src/app/layout.tsx` — Inter via next/font, `--font-inter`.
- `src/app/globals.css` — design tokens (`@theme`), `--font-sans`, utilities
  `.eyebrow .halo .waypoint-pulse .sweep-dot .route-dash .skeleton`, reduced-motion.
- `src/app/(app)/page.tsx` — beranda (spotlight + orb + StatRows).
- `src/app/(app)/today/page.tsx` — Hari Ini (spotlight, stat naratif).
- `src/app/(app)/goals/page.tsx` — featured waypoint card + JourneyRoute.
- `src/app/(app)/goals/[id]/page.tsx` — peta posisi, tag SEKARANG, stat naratif.
- `src/app/(app)/tasks/[id]/page.tsx` — task detail (stat naratif, SectionHeader).
- `src/app/(app)/dashboard/page.tsx` — ringkasan orb + naratif.
- `src/app/(app)/settings/page.tsx` — statistik akun naratif.
- `src/app/components/shell/AppShell.tsx` — dim mode fokus, bottom-nav 48px,
  safe-area, restore focus GlobalAIDrawer.
- `src/app/components/shell/Sidebar.tsx` — kata kerja per rute, waypoint aktif.
- `src/app/components/core/SessionFocusMode.tsx` — FocusOrb timer + zen + dim.
- `src/app/components/ui/Dialog.tsx` — focus trap/restore/aria.
- `src/app/components/ui/StatRow.tsx` — `dt`/`dd` berdekatan (HTML semantik).

**Added:**
- `src/app/components/core/JourneyRoute.tsx` (+ `CurrentWaypointTag`)
- `src/app/components/core/FocusOrb.tsx`
- `src/app/components/core/NextActionSpotlight.tsx`
- `src/app/components/focus-mode-store.ts`
- `src/app/components/ui/{Card,SectionHeader,Input,Textarea,Select,SegmentedControl,Skeleton,StatRow}.tsx`

**Removed (obsolete, sudah diganti):**
- `src/app/components/core/NextActionCard.tsx`
- `src/app/components/core/ProgressSnapshot.tsx`

---

## 11. Files NOT Changed

| Area | Status |
| --- | --- |
| `prisma/**` (schema & migrations) | Tidak disentuh |
| `src/app/api/**` (semua route API) | Tidak disentuh |
| `src/services/**` (today, dashboard, analytics, session, task, goal, review, progress, ai-command, capture, dst.) | Tidak disentuh |
| `src/lib/**` (auth, prisma, format) | Tidak disentuh |
| `src/ai/**` & `nlp/**` | Tidak disentuh |
| `tests/**` (16 file, 134 test) | Tidak disentuh |
| `.github/workflows/**` | Tidak disentuh |
| Dockerfile / docker-compose / DEPLOY.md | Tidak disentuh |
| `package.json` / lockfile | Tidak ada dependency baru |
| `akun.txt`, `Personal Progress OS.bat`, `.env` | Tidak disentuh (tidak di-commit) |

---

## 12. Verification Results

| Pemeriksaan | Hasil |
| --- | --- |
| `npx tsc --noEmit` | Lulus — 0 error |
| `npm run lint` | Lulus — 0 error, 0 warning |
| `npm run test` | Lulus — 16 files, **134/134 passed** |
| `npm run build` | Lulus — compiled successfully, 14 routes (semua route tetap) |

---

**Pernyataan:**
> Functionality, backend, API, database, AI, authentication, security, and
> business logic were **not changed** during this UI/UX redesign. All routes,
> API contracts, data shapes, and behavior remain identical — only the
> presentation layer was redesigned.