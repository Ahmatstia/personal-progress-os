# PHASE 9 USER TEST SCRIPT
## Real User Experience Testing Protocol

**Product:** MyLife (Personal Life Operating System)  
**Test Objective:** Evaluate onboarding, discoverability, cognitive load, and the core daily workflow from a human user's perspective.  
**Tester Profile:** Knowledge worker / student aiming to organize personal goals, projects, daily focus, and reflections.  

---

### Instructions for the Evaluator
- Observe the user without prompting or leading them.
- Note any pauses longer than 5 seconds, misclicks, confusing terminology, or expressions of uncertainty.
- Do not ask for or record any sensitive passwords or personal credentials.

---

### Test Scenarios & Task Checklist

#### Task 1: First Impression & Orientation
- **Prompt:** "Buka aplikasi MyLife, lakukan login, dan ceritakan apa yang pertama kali Anda pahami tentang fungsi aplikasi ini."
- **Expected Flow:** User lands on Home (`/`), reads the greeting and quick status, and identifies that MyLife is their personal command center.
- **Success Criteria:** User identifies the primary next step within 15 seconds.
- **Observations / Notes:** `[ ] Pass  [ ] Hesitated  [ ] Confused`

---

#### Task 2: Goal & Stage Creation
- **Prompt:** "Buat sebuah Goal baru dengan judul 'Meningkatkan Kebugaran Fisik' dan buat Stage pertama 'Rutin Olahraga 3x Seminggu'."
- **Expected Flow:**
  1. Navigate to `/goals` via sidebar or hero button.
  2. Click "Buat Goal" / "Goal Baru".
  3. Fill title, choose type, and submit.
  4. In Goal Detail, click "Tambah Stage" and add stage name.
- **Success Criteria:** Goal and first stage created in < 60 seconds without errors.
- **Observations / Notes:** `[ ] Pass  [ ] Hesitated  [ ] Confused`

---

#### Task 3: Project & Milestone Setup
- **Prompt:** "Buka menu Projects, buat Project baru bernama 'Renovasi Kamar Kerja', lalu buat Milestone pertama 'Pilih Meja Ergonomis'."
- **Expected Flow:**
  1. Click "Projects" in sidebar.
  2. Click "Project Baru".
  3. Enter title and save.
  4. Click the newly created project to enter details.
  5. Click "Tambah Milestone", enter title, and save.
- **Success Criteria:** Project and milestone visible and interactive.
- **Observations / Notes:** `[ ] Pass  [ ] Hesitated  [ ] Confused`

---

#### Task 4: Task Creation & Linking
- **Prompt:** "Tambahkan satu tugas baru ke dalam Goal Anda, dan satu tugas baru ke dalam Project Anda."
- **Expected Flow:**
  1. Inside Goal stage: click "+ Task baru", enter title "Jogging 20 menit pagi", and submit.
  2. Inside Project: click "+ Tambah Task", enter title "Riset meja standing desk", and submit.
- **Success Criteria:** Both tasks appear under their respective parent structures.
- **Observations / Notes:** `[ ] Pass  [ ] Hesitated  [ ] Confused`

---

#### Task 5: Daily Focus Selection & Today Command Center
- **Prompt:** "Buka menu 'Hari Ini' (`/today`) atau 'Fokus Harian' (`/focus`), lalu pilih task yang baru dibuat sebagai fokus hari ini."
- **Expected Flow:**
  1. Navigate to `/today` or `/focus`.
  2. Select task from available list.
  3. Observe the task appear in the Daily Focus list and the Focus Progress Orb update.
- **Success Criteria:** User understands why this task is their priority for today.
- **Observations / Notes:** `[ ] Pass  [ ] Hesitated  [ ] Confused`

---

#### Task 6: Focus Session & Task Completion
- **Prompt:** "Mulai sesi kerja (timer fokus) pada task tersebut, tunggu sejenak, lalu selesaikan tugasnya."
- **Expected Flow:**
  1. Click "Mulai sesi" / "Mulai fokus".
  2. Observe timer running.
  3. Click "Selesaikan task" or "Selesai sesi".
  4. Provide quick reflection.
- **Success Criteria:** Task marked COMPLETED, momentum/stats updated, positive feedback displayed.
- **Observations / Notes:** `[ ] Pass  [ ] Hesitated  [ ] Confused`

---

#### Task 7: Quick Capture & Conversion
- **Prompt:** "Bayangkan Anda tiba-tiba teringat ide buku yang ingin dibaca. Catat ide itu secepat mungkin di Inbox, lalu ubah catatan itu menjadi Task."
- **Expected Flow:**
  1. Click "Inbox Catatan" (`/capture`) or use the QuickCapture widget in Today.
  2. Type "Beli buku Atomic Habits" and submit.
  3. Click "Konversi" -> "Jadikan Task".
  4. Select parent and confirm.
- **Success Criteria:** Process feels instant (< 20 seconds).
- **Observations / Notes:** `[ ] Pass  [ ] Hesitated  [ ] Confused`

---

#### Task 8: Calendar Agenda
- **Prompt:** "Jadwalkan satu sesi fokus pada Kalender untuk besok jam 09:00."
- **Expected Flow:**
  1. Navigate to `/calendar`.
  2. Click "Tambah Jadwal" / "Buat Event".
  3. Enter title, start time, end time, and save.
  4. View the scheduled slot on the calendar grid.
- **Success Criteria:** Event is saved and linked.
- **Observations / Notes:** `[ ] Pass  [ ] Hesitated  [ ] Confused`

---

#### Task 9: Insights & Weekly Review
- **Prompt:** "Buka menu Insights dan Review. Jelaskan apa yang Anda pahami dari skor Life Health dan ringkasan mingguan Anda."
- **Expected Flow:**
  1. Navigate to `/insights`: view Life Health score, smart priority ranking, and conflict detection.
  2. Navigate to `/review`: view weekly reflection summary and timeline.
- **Success Criteria:** User can explain their health score and feels encouraged by the review ritual.
- **Observations / Notes:** `[ ] Pass  [ ] Hesitated  [ ] Confused`

---

#### Task 10: Data Sovereignty & Export
- **Prompt:** "Buka menu Pengaturan dan unduh cadangan lengkap seluruh data Anda."
- **Expected Flow:**
  1. Click "Pengaturan" (`/settings`).
  2. Click "Unduh Cadangan JSON".
  3. File downloads to local storage.
- **Success Criteria:** Complete JSON backup downloaded in 1 click.
- **Observations / Notes:** `[ ] Pass  [ ] Hesitated  [ ] Confused`

---

### Evaluation Scorecard (Post-Test)

| Usability Metric | Rating (1–5) | Feedback / Remarks |
|---|---|---|
| **Ease of Learning (Learnability)** | | |
| **Speed of Execution (Efficiency)** | | |
| **Clarity of Structure (Mental Model)** | | |
| **Visual Calmness & Aesthetic Appeal** | | |
| **Sense of Control & Data Trust** | | |
| **Likelihood of Daily Use** | | |
