export interface ArchitectureNode {
  id: string;
  name: string;
  layer: "CORE" | "DIRECTION" | "EXECUTION" | "TEMPORAL" | "INTELLIGENCE";
  shortDescription: string;
  icon: string;
  route?: string;
  connectedTo: string[]; // Node IDs that this node connects with
  color: {
    bg: string;
    border: string;
    glow: string;
    text: string;
  };
}

export interface FeatureDetail {
  id: string;
  title: string;
  badge: string;
  route?: string;
  purpose: string;
  whyItMatters: string;
  stepByStepGuide: string[];
  keyAttributes: Array<{ name: string; desc: string }>;
  proTips: string[];
  commonMistakes: string[];
}

export interface FeatureRelation {
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  relationshipType: "HIERARCHICAL" | "CONVERSION" | "EXECUTION" | "ANALYTICAL" | "DISPATCH";
  summary: string;
  howToUseTogether: string[];
  dataFlowDescription: string;
  realWorldExample: string;
}

export interface StoryboardStep {
  stepNumber: number;
  phase: string;
  title: string;
  situation: string;
  userAction: string;
  systemResponse: string;
  activeFeatures: string[];
  lesson: string;
}

// ==============================================================================
// 1. ARCHITECTURE NODES (For Interactive Constellation Graph)
// ==============================================================================
export const ARCHITECTURE_LAYERS = [
  { id: "CORE", name: "0. Core & Security", subtitle: "Otentikasi & Preferensi Sovereign" },
  { id: "DIRECTION", name: "1. Direction Layer", subtitle: "Kompas & Pilar Hidup (Area, Goal, Project)" },
  { id: "EXECUTION", name: "2. Execution Layer", subtitle: "Aksi Atomik & Deep Work (Task, Focus, Pomodoro)" },
  { id: "TEMPORAL", name: "3. Temporal Layer", subtitle: "Dimensi Waktu & Kalender (Plan vs Reality)" },
  { id: "INTELLIGENCE", name: "4. Intelligence Layer", subtitle: "Otak Analitik & Peringatan Telegram" },
];

export const ARCHITECTURE_NODES: ArchitectureNode[] = [
  {
    id: "auth",
    name: "Gerbang Akses (Auth)",
    layer: "CORE",
    shortDescription: "Satu-satunya pintu masuk aplikasi berbasis kode rahasia unik (AUTH_ACCESS_CODE).",
    icon: "🔐",
    route: "/login",
    connectedTo: ["preferences", "areas", "capture"],
    color: {
      bg: "bg-rose-500/10",
      border: "border-rose-500/40",
      glow: "rgba(244, 63, 94, 0.4)",
      text: "text-rose-400",
    },
  },
  {
    id: "preferences",
    name: "Preferensi & Pengaturan",
    layer: "CORE",
    shortDescription: "Pusat kontrol tema, zona waktu, batas fokus harian, dan koneksi Telegram/Email.",
    icon: "⚙️",
    route: "/settings",
    connectedTo: ["auth", "focus", "notifications"],
    color: {
      bg: "bg-slate-500/10",
      border: "border-slate-500/40",
      glow: "rgba(148, 163, 184, 0.3)",
      text: "text-slate-300",
    },
  },
  {
    id: "areas",
    name: "Areas (Pilar Hidup)",
    layer: "DIRECTION",
    shortDescription: "Dimensi hidup permanen tanpa batas tanggal (misal: Kesehatan, Karier, Finansial).",
    icon: "🧭",
    route: "/areas",
    connectedTo: ["goals", "projects", "insights"],
    color: {
      bg: "bg-violet-500/10",
      border: "border-violet-500/40",
      glow: "rgba(139, 92, 246, 0.4)",
      text: "text-violet-400",
    },
  },
  {
    id: "goals",
    name: "Goals (Tujuan Besar)",
    layer: "DIRECTION",
    shortDescription: "Target jangka panjang dengan tahapan (Stages) dan sub-objektif terukur.",
    icon: "🎯",
    route: "/goals",
    connectedTo: ["areas", "stages", "review"],
    color: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/40",
      glow: "rgba(245, 158, 11, 0.4)",
      text: "text-amber-400",
    },
  },
  {
    id: "projects",
    name: "Projects (Inisiatif)",
    layer: "DIRECTION",
    shortDescription: "Inisiatif terikat waktu dengan hasil konkret (deliverable) dan pos Milestones.",
    icon: "📦",
    route: "/projects",
    connectedTo: ["areas", "stages", "tasks"],
    color: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/40",
      glow: "rgba(59, 130, 246, 0.4)",
      text: "text-blue-400",
    },
  },
  {
    id: "stages",
    name: "Stages & Milestones",
    layer: "EXECUTION",
    shortDescription: "Fase berurutan di dalam Goal atau checkpoint capaian di dalam Project.",
    icon: "🪜",
    connectedTo: ["goals", "projects", "tasks"],
    color: {
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/40",
      glow: "rgba(6, 182, 212, 0.4)",
      text: "text-cyan-400",
    },
  },
  {
    id: "tasks",
    name: "Tasks (Tugas Atomik)",
    layer: "EXECUTION",
    shortDescription: "Entitas kerja terkecil yang dieksekusi, diestimasi, dan memiliki status nyata.",
    icon: "✅",
    route: "/today",
    connectedTo: ["stages", "projects", "focus", "sessions", "calendar"],
    color: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/40",
      glow: "rgba(16, 185, 129, 0.4)",
      text: "text-emerald-400",
    },
  },
  {
    id: "focus",
    name: "Fokus Harian (Daily Focus)",
    layer: "EXECUTION",
    shortDescription: "Kurasi 3–5 tugas terpenting hari ini untuk mencegah kelelahan kognitif (*overwhelm*).",
    icon: "⚡",
    route: "/focus",
    connectedTo: ["tasks", "sessions", "insights"],
    color: {
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/40",
      glow: "rgba(234, 179, 8, 0.4)",
      text: "text-yellow-400",
    },
  },
  {
    id: "sessions",
    name: "Pomodoro & Sessions",
    layer: "EXECUTION",
    shortDescription: "Pencatat menit kerja mendalam (deep work) aktual yang menempel pada sebuah Task.",
    icon: "⏱️",
    connectedTo: ["tasks", "activity", "review"],
    color: {
      bg: "bg-red-500/10",
      border: "border-red-500/40",
      glow: "rgba(239, 68, 68, 0.4)",
      text: "text-red-400",
    },
  },
  {
    id: "capture",
    name: "Inbox Catatan (Capture)",
    layer: "DIRECTION",
    shortDescription: "Otak eksternal tempat mendump ide mentah seketika sebelum diubah menjadi Task/Goal.",
    icon: "📥",
    route: "/capture",
    connectedTo: ["auth", "tasks", "goals", "projects"],
    color: {
      bg: "bg-pink-500/10",
      border: "border-pink-500/40",
      glow: "rgba(236, 72, 153, 0.4)",
      text: "text-pink-400",
    },
  },
  {
    id: "calendar",
    name: "Kalender (Rencana)",
    layer: "TEMPORAL",
    shortDescription: "Plot jadwal waktu masa depan untuk mengalokasikan agenda kerja dan kegiatan.",
    icon: "📅",
    route: "/calendar",
    connectedTo: ["tasks", "activity", "insights"],
    color: {
      bg: "bg-teal-500/10",
      border: "border-teal-500/40",
      glow: "rgba(20, 184, 166, 0.4)",
      text: "text-teal-400",
    },
  },
  {
    id: "activity",
    name: "Aktivitas (Realita)",
    layer: "TEMPORAL",
    shortDescription: "Log rekaman waktu masa lalu: apa yang sebenarnya terjadi vs apa yang direncanakan.",
    icon: "📜",
    route: "/activity",
    connectedTo: ["sessions", "calendar", "review"],
    color: {
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/40",
      glow: "rgba(99, 102, 241, 0.4)",
      text: "text-indigo-400",
    },
  },
  {
    id: "insights",
    name: "Otak Cerdas (Insights)",
    layer: "INTELLIGENCE",
    shortDescription: "Mesin kalkulasi: Smart Priority Score, Conflict Detection, dan Life Health Balance.",
    icon: "🔮",
    route: "/insights",
    connectedTo: ["areas", "tasks", "calendar", "notifications"],
    color: {
      bg: "bg-purple-500/10",
      border: "border-purple-500/40",
      glow: "rgba(168, 85, 247, 0.4)",
      text: "text-purple-400",
    },
  },
  {
    id: "notifications",
    name: "Notifikasi & Telegram Bot",
    layer: "INTELLIGENCE",
    shortDescription: "Pengingat proaktif real-time langsung ke ponsel via bot Telegram (@PoppieDipsyBot).",
    icon: "🔔",
    route: "/notifications",
    connectedTo: ["insights", "preferences", "tasks"],
    color: {
      bg: "bg-sky-500/10",
      border: "border-sky-500/40",
      glow: "rgba(14, 165, 233, 0.4)",
      text: "text-sky-400",
    },
  },
  {
    id: "review",
    name: "Refleksi Mingguan (Review)",
    layer: "INTELLIGENCE",
    shortDescription: "Ritual penutup mingguan untuk mengevaluasi kemenangan, kendala, dan merestart fokus.",
    icon: "🪞",
    route: "/review",
    connectedTo: ["goals", "sessions", "activity"],
    color: {
      bg: "bg-fuchsia-500/10",
      border: "border-fuchsia-500/40",
      glow: "rgba(217, 70, 239, 0.4)",
      text: "text-fuchsia-400",
    },
  },
];

// ==============================================================================
// 2. DETAILED STEP-BY-STEP CHAPTERS
// ==============================================================================
export const TUTORIAL_CHAPTERS: FeatureDetail[] = [
  {
    id: "auth-chapter",
    title: "Bab 0: Otentikasi & Gerbang Akses (The Gatekeeper)",
    badge: "Keamanan Sovereign",
    route: "/login",
    purpose: "Menjaga sistem Anda privat 100% tanpa registrasi publik, menggunakan satu kunci akses unik.",
    whyItMatters: "Personal Progress OS bukan aplikasi SaaS publik yang membagikan data Anda ke orang lain. Aplikasi ini adalah 'Sovereign Operating System' milik pribadi Anda. Otentikasi menggunakan kode sandi unik (AUTH_ACCESS_CODE) yang ditandatangani dengan HMAC-SHA256, sehingga tidak memerlukan email verifikasi atau form registrasi rumit.",
    stepByStepGuide: [
      "Buka file '.env' di folder project Anda.",
      "Perhatikan variabel 'AUTH_ACCESS_CODE'. Nilai ini adalah password/kunci tunggal Anda (misalnya: 'dwsamunkwxw783').",
      "Saat mengakses aplikasi pertama kali, Anda akan diarahkan ke layar /login.",
      "Ketikkan kode tersebut ke form login lalu tekan Masuk.",
      "Sistem memverifikasi kecocokan kode secara timing-safe (mencegah timing attack) dan membuat cookie sesi terenkripsi (ppos_session) yang berlaku selama 30 hari.",
    ],
    keyAttributes: [
      { name: "AUTH_ACCESS_CODE", desc: "Kunci pintu masuk utama yang didefinisikan di lingkungan server (.env)." },
      { name: "ppos_session", desc: "Cookie sesi aman berstandar HttpOnly & SameSite=Lax." },
      { name: "Fail-Closed", desc: "Jika server tidak memiliki kunci konfigurasi, sistem otomatis menolak login demi keselamatan data." },
    ],
    proTips: [
      "Simpan AUTH_ACCESS_CODE di password manager Anda.",
      "Untuk keluar dari aplikasi di browser publik, cukup klik tombol Logout di bagian bawah Sidebar.",
    ],
    commonMistakes: [
      "Mengira aplikasi ini memiliki tombol 'Register/Daftar Akun Baru' seperti media sosial.",
      "Menghapus atau mengosongkan AUTH_ACCESS_CODE di .env.",
    ],
  },
  {
    id: "areas-chapter",
    title: "Bab 1: Areas — Kompas & Pilar Hidup Permanen",
    badge: "Fondasi Arah",
    route: "/areas",
    purpose: "Menampung seluruh aspek fundamental hidup Anda yang tidak pernah memiliki tanggal selesai.",
    whyItMatters: "Sebelum membuat ratusan to-do list, Anda harus tahu untuk apa Anda bekerja. Area adalah pilar abadi (misal: 'Kesehatan & Fisik', 'Karier & Engineering', 'Keluarga', 'Finansial'). Area tidak pernah berstatus 'COMPLETED' karena pilar hidup harus dijaga seumur hidup.",
    stepByStepGuide: [
      "Buka menu 'Areas' di Sidebar.",
      "Klik tombol 'Tambah Area Baru'.",
      "Beri nama pilar hidup Anda (misal: 'Karier Software Engineer').",
      "Tentukan ikon atau warna pembeda.",
      "Tulis deskripsi singkat standar ideal pilar tersebut (misal: 'Menjaga keahlian teknis relevan dan portofolio berkualitas').",
      "Setelah dibuat, Anda bisa mulai menautkan Goal atau Project ke dalam Area ini.",
    ],
    keyAttributes: [
      { name: "name", desc: "Label nama pilar hidup permanen." },
      { name: "description", desc: "Visi standar kualitas untuk pilar tersebut." },
      { name: "archived", desc: "Status non-aktif jika pilar tersebut ingin disembunyikan tanpa dihapus." },
    ],
    proTips: [
      "Batasi Area hanya antara 4 sampai 7 pilar agar fokus hidup Anda tidak terpecah-pecah.",
      "Mesin Life Health di menu Insights akan mengukur seberapa seimbang waktu yang Anda curahkan untuk masing-masing Area.",
    ],
    commonMistakes: [
      "Membuat Area yang sifatnya sementara (misal: 'Beli Laptop Baru' — ini bukan Area, ini adalah Project).",
    ],
  },
  {
    id: "goals-projects-chapter",
    title: "Bab 2: Goals & Projects — Membedakan Hasil vs Deliverable",
    badge: "Hasil vs Inisiatif",
    route: "/goals",
    purpose: "Membedakan antara hasil akhir jangka panjang (Goal) dengan proyek bertenggat waktu (Project).",
    whyItMatters: "Banyak orang gagal karena mencampuradukkan 'Goal' dan 'Project'. Di OS ini, keduanya dipisahkan secara elegan:\n• GOAL: Keadaan yang ingin dicapai (misal: 'Fasih berbicara bahasa Jepang'). Dipecah menjadi Stages (Fase).\n• PROJECT: Inisiatif dengan output nyata & batas waktu (misal: 'Menyelesaikan modul aplikasi Web Portfolio'). Dipecah menjadi Milestones.",
    stepByStepGuide: [
      "Buka menu 'Goals' untuk target jangka panjang atau 'Projects' untuk pekerjaan bertenggat waktu.",
      "Saat membuat Goal, pilih Area terkait (misal Goal 'Kuasai Next.js' ditautkan ke Area 'Karier').",
      "Tentukan tipe Goal: LEARNING (belajar), ACHIEVEMENT (pencapaian), HABIT (kebiasaan), atau MAINTENANCE.",
      "Buat tahapan di dalam Goal yang disebut 'Stages' (misal: Stage 1: Fundamental, Stage 2: Real App).",
      "Jika membuat Project, tentukan Deadline dan pos pencapaian ('Milestones').",
    ],
    keyAttributes: [
      { name: "Goal.status", desc: "ACTIVE, PAUSED, COMPLETED, CANCELLED, atau ARCHIVED." },
      { name: "Stage", desc: "Urutan tahapan logis menuju tercapainya Goal." },
      { name: "Milestone", desc: "Checkpoint penanda progres di dalam Project." },
    ],
    proTips: [
      "Setiap Project sebaiknya memiliki deadline yang jelas, sedangkan Goal bisa memiliki target fleksibel.",
      "Progress bar Goal akan otomatis terisi saat tugas-tugas di dalamnya Anda centang selesai!",
    ],
    commonMistakes: [
      "Membuat Project tanpa deadline sehingga terkatung-katung selamanya.",
    ],
  },
  {
    id: "capture-chapter",
    title: "Bab 3: Capture (Inbox) — Otak Eksternal Bebas Distraksi",
    badge: "GTD Quick Dump",
    route: "/capture",
    purpose: "Mencatat setiap ide liar, tugas dadakan, atau link referensi tanpa memutus alur fokus Anda.",
    whyItMatters: "Prinsip Getting Things Done (GTD): Otak manusia dirancang untuk melahirkan ide, bukan untuk menyimpannya. Saat Anda sedang fokus ngoding lalu tiba-tiba teringat 'harus bayar internet', jangan langsung dikerjakan! Catat langsung di Capture Inbox, lalu lanjutkan pekerjaan Anda.",
    stepByStepGuide: [
      "Saat ada ide/tugas muncul tiba-tiba, buka menu 'Inbox Catatan' (/capture).",
      "Ketik teks cepat (misal: 'Riset library chart untuk visualisasi progress').",
      "Pilih tipe: NOTE (catatan), IDEA (ide baru), TASK (tugas mentah), atau RESOURCE (tautan/artikel).",
      "Klik Simpan. Pikiran Anda kini kembali tenang dan fokus.",
      "Di sore hari atau saat sesi review, buka kembali Inbox lalu klik tombol 'Konversi (Convert)' untuk menjadikannya Task resmi, Goal, atau Project terstruktur!",
    ],
    keyAttributes: [
      { name: "rawContent", desc: "Isi teks mentah yang Anda ketikkan tanpa perlu format rapi." },
      { name: "type", desc: "Klasifikasi awal: NOTE, IDEA, TASK, RESOURCE." },
      { name: "status", desc: "PENDING (menunggu ditindaklanjuti) atau PROCESSED (sudah dikonversi)." },
    ],
    proTips: [
      "Gunakan shortcut cepat atau buat bookmark /capture di browser HP Anda untuk quick capture kapan saja.",
    ],
    commonMistakes: [
      "Membiarkan catatan di Capture menumpuk berbulan-bulan tanpa pernah disortir (*triage*).",
    ],
  },
  {
    id: "tasks-chapter",
    title: "Bab 4: Tasks — Unit Atomik Eksekusi Pekerjaan",
    badge: "Eksekusi Nyata",
    route: "/today",
    purpose: "Mengubah visi abstrak menjadi langkah-langkah kerja yang bisa diselesaikan hari ini.",
    whyItMatters: "Task adalah darah dari Personal Progress OS. Tanpa Task yang dieksekusi, semua Goal dan Project hanyalah angan-angan. Task di sistem ini memiliki estimasi jam kerja, tenggat waktu (due date), tingkat prioritas (LOW, MEDIUM, HIGH, URGENT), dan dapat ditautkan ke Stage dari sebuah Goal.",
    stepByStepGuide: [
      "Buka menu 'Hari Ini' (/today) atau masuk ke detail Goal/Project tertentu.",
      "Klik tombol 'Tambah Task'.",
      "Isi judul task yang diawali kata kerja (misal: 'Tulis unit test untuk reminder service', bukan 'Testing').",
      "Isi estimasi jam kerja (Estimated Hours) — ini penting untuk mesin Daily Plan menganalisis beban kerja Anda.",
      "Pilih tingkat prioritas dan tanggal jatuh tempo jika ada.",
      "Task sekarang siap dieksekusi atau dimasukkan ke dalam Daily Focus.",
    ],
    keyAttributes: [
      { name: "estimatedHours", desc: "Perkiraan waktu pengerjaan dalam satuan jam." },
      { name: "priority", desc: "Tingkat urgensi: LOW, MEDIUM, HIGH, URGENT." },
      { name: "status", desc: "TODO, IN_PROGRESS, COMPLETED, CANCELLED, BACKLOG." },
    ],
    proTips: [
      "Pecah task yang estimasinya lebih dari 4 jam menjadi 2–3 sub-task yang lebih kecil.",
    ],
    commonMistakes: [
      "Menulis task yang terlalu ambigu seperti 'Bikin website' (terlalu besar, seharusnya Project).",
    ],
  },
  {
    id: "focus-sessions-chapter",
    title: "Bab 5: Daily Focus & Pomodoro — Menjaga Ritme Deep Work",
    badge: "Deep Work Engine",
    route: "/focus",
    purpose: "Membatasi pekerjaan harian agar tidak burnout dan merekam menit kerja produktif yang nyata.",
    whyItMatters: "Melihat daftar 50 tugas sekaligus membuat otak kewalahan (*paralysis*). Di menu Daily Focus (/focus), sistem memaksa Anda memilih HANYA 3–5 tugas terpenting untuk hari ini. Lalu dengan Pomodoro Widget, Anda mengeksekusinya dalam interval fokus 25 menit.",
    stepByStepGuide: [
      "Setiap pagi, buka menu 'Fokus Harian' (/focus).",
      "Pilih maksimal 3 sampai 5 task dari daftar to-do Anda untuk dijadikan 'Top Focus Hari Ini'.",
      "Saat siap bekerja, klik tombol 'Mulai Sesi' di Pomodoro Panel (atau tombol play di samping task).",
      "Panel Pomodoro akan mulai menghitung mundur 25 menit sesi fokus murni.",
      "Saat waktu habis, sistem otomatis mencatat sebuah entri 'Session' ke database yang merekam durasi kerja Anda.",
      "Centang task jika sudah selesai, dan nikmati kepuasan progres nyata!",
    ],
    keyAttributes: [
      { name: "DailyFocus", desc: "Daftar kurasi tugas prioritas tertinggi khusus hari ini." },
      { name: "Session", desc: "Rekaman waktu aktual kerja (actual duration) yang menempel ke Task." },
      { name: "Pomodoro Panel", desc: "Widget timer mengambang yang dapat dijeda, dihentikan, dan disesuaikan." },
    ],
    proTips: [
      "Data menit kerja dari Session adalah bahan bakar utama untuk grafik Analitik dan kalkulasi Life Health di Insights.",
    ],
    commonMistakes: [
      "Memasukkan 15 tugas ke dalam Daily Focus (ini melanggar prinsip fokus).",
    ],
  },
  {
    id: "calendar-activity-chapter",
    title: "Bab 6: Kalender vs Aktivitas — Rencana Masa Depan vs Realita Waktu",
    badge: "Waktu & Log",
    route: "/calendar",
    purpose: "Menjembatani perbedaan antara apa yang Anda rencanakan dengan apa yang sebenarnya Anda kerjakan.",
    whyItMatters: "Rencana jarang 100% cocok dengan kenyataan. Personal Progress OS memisahkan keduanya secara cerdas:\n• KALENDER (/calendar): Rencana alokasi waktu masa depan (CalendarEvent), misal: 'Rapat jam 10:00' atau 'Jadwal ngoding jam 14:00'.\n• AKTIVITAS (/activity): Rekaman historis apa yang benar-benar Anda lakukan (Activity log).",
    stepByStepGuide: [
      "Buka menu 'Kalender' (/calendar) untuk memplot blok waktu kegiatan penting Anda.",
      "Sistem akan mendeteksi apakah ada task deadline yang bertabrakan dengan jadwal kalender.",
      "Buka menu 'Aktivitas' (/activity) untuk melihat log kronologis: task apa yang diselesaikan, sesi fokus apa yang berjalan, dan catatan harian apa yang tercatat.",
    ],
    keyAttributes: [
      { name: "CalendarEvent", desc: "Blok jadwal rencana masa depan dengan waktu mulai dan selesai." },
      { name: "Activity", desc: "Catatan riwayat aksi nyata yang terjadi di masa lalu." },
    ],
    proTips: [
      "Gunakan time-blocking di kalender untuk mengamankan 2 jam 'deep work' tanpa gangguan.",
    ],
    commonMistakes: [
      "Menjadwalkan setiap menit di kalender secara kaku tanpa menyisakan jeda istirahat.",
    ],
  },
  {
    id: "insights-chapter",
    title: "Bab 7: Otak Cerdas (Insights) — AI Tanpa Halu, Murni Matematika Logis",
    badge: "Proactive Brain",
    route: "/insights",
    purpose: "Memberi tahu Anda APA yang harus dikerjakan selanjutnya, MENGAPA itu penting, dan di mana konflik jadwal Anda.",
    whyItMatters: "Anda tidak perlu pusing memikirkan 'Habis ini ngerjain apa ya?'. Mesin Insights mengkalkulasi data seluruh sistem:\n1. Smart Priority: Menghitung skor prioritas tugas berdasarkan deadline, status goal, dan bobot pilar hidup.\n2. Conflict Detection: Memperingatkan jika Anda punya 2 agenda bertabrakan atau deadline di hari yang padat.\n3. Life Health Score: Mengukur apakah Anda terlalu gila kerja (overwork) dan melupakan pilar kesehatan.",
    stepByStepGuide: [
      "Buka menu 'Insights' (/insights).",
      "Lihat kartu 'Needs Attention': Tugas atau pilar yang paling genting butuh tindakan Anda.",
      "Periksa bagian 'Smart Priority Ranking': Tugas diurutkan secara matematis dengan penjelasan transparan.",
      "Cek tab 'Deteksi Konflik' untuk melihat apakah ada tanggal deadline yang mustahil diselesaikan.",
      "Pantau grafik 'Life Health' untuk memastikan roda kehidupan Anda berputar seimbang.",
    ],
    keyAttributes: [
      { name: "SmartPriorityEngine", desc: "Algoritma pembobotan transparan: Urgency + Importance + Goal Impact." },
      { name: "ConflictEngine", desc: "Pendeteksi tabrakan waktu dan overload kapasitas kerja harian." },
      { name: "LifeHealthScore", desc: "Skor 0–100% keseimbangan hidup antar seluruh Area." },
    ],
    proTips: [
      "Gunakan rekomendasi urutan tugas dari Smart Priority sebagai panduan memilih Daily Focus setiap pagi.",
    ],
    commonMistakes: [
      "Mengabaikan peringatan konflik jadwal hingga akhirnya tugas telat diselesaikan.",
    ],
  },
  {
    id: "notifications-telegram-chapter",
    title: "Bab 8: Notifikasi & Telegram Bot — Asisten yang Memanggil ke HP Anda",
    badge: "Real-Time Push",
    route: "/notifications",
    purpose: "Mengirimkan pengingat proaktif langsung ke layar ponsel Anda agar tidak ada deadline yang terlewat.",
    whyItMatters: "Aplikasi produktivitas tidak ada gunanya jika Anda lupa membukanya. Dengan menghubungkan Telegram Bot (@PoppieDipsyBot), sistem ini aktif memanggil Anda: saat ada tugas jatuh tempo hari ini, jadwal kalender 15 menit lagi, atau saat Anda lupa refleksi mingguan.",
    stepByStepGuide: [
      "Buka menu 'Notifikasi' (/notifications) di aplikasi untuk melihat riwayat pesan masuk in-app.",
      "Buka Telegram di HP Anda, cari bot Anda: @PoppieDipsyBot.",
      "Setiap pagi atau saat ada deadline kritis, bot akan otomatis mengirim pesan chat ke Telegram Anda.",
      "Anda juga bisa menguji pengiriman kapan saja melalui menu 'Settings' -> tombol 'Tes Notifikasi Telegram'.",
      "Fitur 'Quiet Hours' (Jam Tenang) akan menahan notifikasi non-kritis saat Anda sedang tidur di malam hari.",
    ],
    keyAttributes: [
      { name: "In-App Notification", desc: "Notifikasi internal di tabel database yang tampil di lonceng notifikasi." },
      { name: "Telegram Dispatcher", desc: "Kirim pesan instan via Telegram Bot API resmi secara gratis." },
      { name: "Quiet Hours", desc: "Mode senyap otomatis di jam istirahat sesuai zona waktu lokal Anda." },
    ],
    proTips: [
      "Pin chat @PoppieDipsyBot di Telegram Anda agar selalu berada di posisi paling atas chat list.",
    ],
    commonMistakes: [
      "Mematikan notifikasi Telegram sehingga kembali lupa mengeksekusi rencana.",
    ],
  },
  {
    id: "review-chapter",
    title: "Bab 9: Refleksi Mingguan (Review) — Menutup Siklus & Reset Momentum",
    badge: "Ritual Mingguan",
    route: "/review",
    purpose: "Mengevaluasi apa yang berhasil, apa kendala yang dihadapi, dan merestart energi untuk minggu depan.",
    whyItMatters: "Produktivitas tanpa refleksi adalah jalan cepat menuju burnout. Setiap akhir pekan (Jumat/Minggu), luangkan waktu 10 menit di menu Refleksi (/review). Anda menjawab pertanyaan terstruktur: Apa pencapaian terbesar? Di mana waktu terbuang? Apa penyesuaian untuk minggu depan?",
    stepByStepGuide: [
      "Setiap akhir pekan, buka menu 'Refleksi' (/review).",
      "Pilih Goal yang ingin Anda evaluasi (atau lakukan refleksi global).",
      "Isi catatan refleksi, rating kepuasan progres, dan kendala yang dihadapi.",
      "Sistem merangkum total sesi fokus dan persentase penyelesaian tugas minggu ini.",
      "Simpan review. Sistem mencatat streak refleksi Anda dan merestart kesiapan mental untuk minggu berikutnya.",
    ],
    keyAttributes: [
      { name: "wins", desc: "Daftar kemenangan dan pencapaian yang patut disyukuri." },
      { name: "challenges", desc: "Kendala atau distraksi yang menghambat progres." },
      { name: "nextAdjustments", desc: "Rencana perbaikan taktis untuk pekan berikutnya." },
    ],
    proTips: [
      "Jadikan hari Minggu malam sebagai jadwal sakral 15 menit untuk mengisi Weekly Review.",
    ],
    commonMistakes: [
      "Melewatkan sesi review berminggu-minggu sehingga Anda tidak tahu apakah Anda sedang maju atau jalan di tempat.",
    ],
  },
];

// ==============================================================================
// 3. INTERACTIVE FEATURE RELATIONS MATRIX (Fitur A ↔ Fitur B)
// ==============================================================================
export const FEATURE_RELATIONS: FeatureRelation[] = [
  {
    fromId: "areas",
    toId: "goals",
    fromName: "Areas (Pilar Hidup)",
    toName: "Goals (Target)",
    relationshipType: "HIERARCHICAL",
    summary: "Area adalah induk filosofis; Goal adalah target terukur di dalam Area tersebut.",
    howToUseTogether: [
      "Buat Area terlebih dahulu (misal: 'Karier').",
      "Saat membuat Goal baru, pilih Area 'Karier' sebagai payungnya.",
      "Semua progres Goal ini akan otomatis menyumbang skor kesehatan pada Area tersebut di menu Insights.",
    ],
    dataFlowDescription: "1 Area memiliki banyak (1 to Many) Goals. Saat Goal tercapai, nilai completion pilar hidup meningkat.",
    realWorldExample: "Area: 'Kesehatan Fisik' ➡️ Goal: 'Turun berat badan 5 kg dan lari 5K non-stop'.",
  },
  {
    fromId: "areas",
    toId: "projects",
    fromName: "Areas (Pilar Hidup)",
    toName: "Projects (Inisiatif)",
    relationshipType: "HIERARCHICAL",
    summary: "Area menampung proyek-proyek bertenggat waktu yang relevan dengan pilar tersebut.",
    howToUseTogether: [
      "Tautkan Project ke Area tertentu agar tidak ada proyek liar yang tidak jelas tujuannya.",
      "Project yang selesai akan meningkatkan bobot aktivitas pada Area terkait.",
    ],
    dataFlowDescription: "Area 1 to Many Project. Project memiliki deadline tanggal pasti, sedangkan Area permanen.",
    realWorldExample: "Area: 'Karier' ➡️ Project: 'Rilis Web App Portfolio v1 (Deadline: 30 September)'.",
  },
  {
    fromId: "capture",
    toId: "tasks",
    fromName: "Inbox Catatan (Capture)",
    toName: "Tasks (Tugas)",
    relationshipType: "CONVERSION",
    summary: "Ide mentah di Capture diubah (Convert) menjadi Task kerja resmi.",
    howToUseTogether: [
      "Saat ide terlintas tiba-tiba, catat kilat di /capture tanpa mikir panjang.",
      "Saat waktu luang, buka /capture dan klik tombol 'Konversi ke Task'.",
      "Beri estimasi jam, prioritas, dan pilih Goal/Project penampungnya.",
      "Catatan Capture otomatis ditandai PROCESSED dan Task baru siap dikerjakan.",
    ],
    dataFlowDescription: "Capture.status berubah dari PENDING menjadi PROCESSED, dan 1 Task baru dibuat di tabel Task.",
    realWorldExample: "Capture mentah: 'Beli domain baru' ➡️ Dikonversi ke Task: 'Beli domain mylife.id di Niagahoster' (Priority: HIGH).",
  },
  {
    fromId: "capture",
    toId: "goals",
    fromName: "Inbox Catatan (Capture)",
    toName: "Goals (Target)",
    relationshipType: "CONVERSION",
    summary: "Ide besar di Capture dievolusikan menjadi tujuan jangka panjang (Goal).",
    howToUseTogether: [
      "Jika Anda menulis catatan yang skalanya besar di Inbox, jangan jadikan task kecil.",
      "Konversikan langsung menjadi Goal, lalu buat tahapan (Stages) di dalamnya.",
    ],
    dataFlowDescription: "Capture record memicu pembuatan Goal record baru di database.",
    realWorldExample: "Capture: 'Mau belajar bahasa Jerman dari nol sampai B1' ➡️ Dikonversi ke Goal baru di Area Pengembangan Diri.",
  },
  {
    fromId: "goals",
    toId: "tasks",
    fromName: "Goals (Target)",
    toName: "Tasks (Tugas)",
    relationshipType: "HIERARCHICAL",
    summary: "Goal dipecah menjadi Stages, dan setiap Stage memuat daftar Tasks konkret.",
    howToUseTogether: [
      "Di dalam Goal, buat Stage (misal: 'Stage 1: Sintaks Dasar').",
      "Buat Task di bawah Stage tersebut.",
      "Setiap kali Anda mencentang Task selesai, persentase progress bar Goal akan bertambah secara otomatis!",
    ],
    dataFlowDescription: "Goal ➡️ Stage ➡️ Task. Rumus progres: (Total Task Selesai / Total Semua Task di Goal) * 100%.",
    realWorldExample: "Goal: 'Lulus Sertifikasi AWS' ➡️ Stage: 'Modul S3 & EC2' ➡️ Task: 'Praktik setup EC2 instance dan security group'.",
  },
  {
    fromId: "tasks",
    toId: "focus",
    fromName: "Tasks (Tugas)",
    toName: "Daily Focus (Fokus Hari Ini)",
    relationshipType: "EXECUTION",
    summary: "Task adalah inventori to-do; Daily Focus adalah daftar 3–5 tugas terpilih hari ini.",
    howToUseTogether: [
      "Di pagi hari buka menu /focus.",
      "Pilih 3 tugas paling krusial dari bank Task Anda.",
      "Kunci fokus Anda hari itu HANYA pada 3 tugas ini, abaikan tugas lain sampai 3 ini selesai.",
    ],
    dataFlowDescription: "DailyFocus menyimpan relasi taskId dan tanggal hari ini (userId + taskId + date).",
    realWorldExample: "Dari 40 task di database, Anda memilih 3 task paling berdampak untuk dikerjakan hari Selasa ini.",
  },
  {
    fromId: "tasks",
    toId: "sessions",
    fromName: "Tasks (Tugas)",
    toName: "Pomodoro & Sessions",
    relationshipType: "EXECUTION",
    summary: "Session merekam menit deep work aktual yang dihabiskan untuk menyelesaikan Task.",
    howToUseTogether: [
      "Pilih task yang ingin Anda kerjakan di panel Pomodoro.",
      "Nyalakan timer 25 menit.",
      "Fokus penuh tanpa membuka media sosial.",
      "Saat timer berhenti, Session otomatis tersimpan dan menempel pada task tersebut.",
    ],
    dataFlowDescription: "Session record mencatat taskId, durationMinutes (misal: 25), dan timestamp selesai.",
    realWorldExample: "Task 'Desain Database' dikerjakan selama 3 sesi Pomodoro = Tercatat 75 menit kerja produktif.",
  },
  {
    fromId: "sessions",
    toId: "review",
    fromName: "Pomodoro & Sessions",
    toName: "Review (Refleksi Mingguan)",
    relationshipType: "ANALYTICAL",
    summary: "Total menit kerja dari Sessions dirangkum sebagai bahan evaluasi mingguan.",
    howToUseTogether: [
      "Saat mengisi Weekly Review di akhir pekan, sistem akan menampilkan total jam kerja Anda.",
      "Anda bisa melihat apakah waktu kerja Anda sebanding dengan hasil yang dicapai.",
    ],
    dataFlowDescription: "Review service meng-query SUM(durationMinutes) dari tabel Session selama 7 hari terakhir.",
    realWorldExample: "Review Mingguan menunjukkan Anda bekerja 18 jam minggu ini dengan 32 sesi Pomodoro sukses.",
  },
  {
    fromId: "tasks",
    toId: "calendar",
    fromName: "Tasks (Tugas)",
    toName: "Kalender (Jadwal)",
    relationshipType: "HIERARCHICAL",
    summary: "Task memiliki due date; Kalender memplot alokasi blok waktu pengerjaannya.",
    howToUseTogether: [
      "Buka Kalender, buat event 'Sesi Ngoding' dari jam 14:00 - 16:00.",
      "Tautkan task ke blok waktu tersebut agar Anda memiliki komitmen waktu yang jelas.",
    ],
    dataFlowDescription: "CalendarEvent dapat memiliki relasi taskId opsional.",
    realWorldExample: "Task 'Review Pull Request' dialokasikan di Kalender pada hari Rabu pukul 10:00 WIB.",
  },
  {
    fromId: "insights",
    toId: "notifications",
    fromName: "Insights (Otak Cerdas)",
    toName: "Notifikasi & Telegram Bot",
    relationshipType: "DISPATCH",
    summary: "Temuan kritis dari mesin Insights otomatis dikirimkan ke Telegram Anda.",
    howToUseTogether: [
      "Mesin Reminder mengevaluasi task due date dan jadwal kalender.",
      "Jika ada deadline genting atau refleksi terlewat, notifikasi dibuat di database.",
      "Dispatcher eksternal langsung mem-push pesan teks ke bot Telegram Anda (@PoppieDipsyBot).",
    ],
    dataFlowDescription: "Insights Engine ➡️ createNotification() ➡️ dispatchExternalNotification() ➡️ Telegram API.",
    realWorldExample: "Task jatuh tempo hari ini ➡️ Telegram berbunyi: '⚠️ Jatuh Tempo Hari Ini: Tulis Unit Test'.",
  },
];

// ==============================================================================
// 4. REAL-LIFE END-TO-END SCENARIO (The 7-Day Journey Storyboard)
// ==============================================================================
export const REAL_LIFE_STORYBOARD: StoryboardStep[] = [
  {
    stepNumber: 1,
    phase: "Hari Senin 07:00",
    title: "Pintu Masuk & Menentukan Arah",
    situation: "Anda bangun pagi, menyalakan laptop untuk memulai pekan produktif.",
    userAction: "Buka localhost:3000, masukkan AUTH_ACCESS_CODE di layar login. Buka menu /areas untuk mengecek pilar hidup.",
    systemResponse: "Sistem memvalidasi cookie sesi 30 hari. Menampilkan dashboard pilar: Karier, Kesehatan, Finansial, dan Belajar.",
    activeFeatures: ["auth", "areas"],
    lesson: "Mulai hari dengan mengingat 'Pilar Besar' Anda, bukan langsung terjebak memeriksa to-do acak.",
  },
  {
    stepNumber: 2,
    phase: "Hari Senin 08:30",
    title: "Memilih Top 3 Fokus Harian",
    situation: "Ada 25 task di daftar to-do. Jika melihat semuanya, Anda akan merasa tertekan dan bingung.",
    userAction: "Buka menu /focus (Daily Focus). Pilih HANYA 3 tugas terpenting untuk diselesaikan hari ini.",
    systemResponse: "Sistem mengunci 3 tugas tersebut di kartu fokus harian dan menyembunyikan distraksi tugas lainnya.",
    activeFeatures: ["tasks", "focus"],
    lesson: "Kurasi ketat: 3 tugas selesai jauh lebih baik daripada 20 tugas yang dicicil setengah-setengah.",
  },
  {
    stepNumber: 3,
    phase: "Hari Senin 10:15",
    title: "Ide Liar Muncul Saat Bekerja (Quick Capture)",
    situation: "Saat sedang asyik ngoding Task 1, tiba-tiba Anda terpikir ide: 'Eh, kayaknya bagus kalau bikin podcast tech'.",
    userAction: "Jangan buka Twitter atau YouTube! Buka menu /capture, ketik 'Ide podcast tech episode 1', lalu simpan. Lanjutkan ngoding.",
    systemResponse: "Catatan tersimpan aman di Inbox Catatan berstatus PENDING. Tidak ada gangguan pada sesi kerja Anda.",
    activeFeatures: ["capture"],
    lesson: "Otak Anda tetap tenang karena tahu idenya sudah tersimpan aman tanpa harus dikerjakan saat itu juga.",
  },
  {
    stepNumber: 4,
    phase: "Hari Senin 14:00",
    title: "Sesi Deep Work dengan Pomodoro",
    situation: "Memasuki pengerjaan Task 2 yang membutuhkan konsentrasi tinggi tanpa terganggu notifikasi.",
    userAction: "Klik tombol play pada Pomodoro Panel untuk Task 2. Timer 25 menit mulai berjalan.",
    systemResponse: "Timer menghitung mundur. Saat selesai, sistem otomatis menyimpan 1 Session (25 menit) ke database.",
    activeFeatures: ["sessions", "tasks"],
    lesson: "Setiap menit kerja Anda diakui dan tercatat sebagai data konkret, bukan sekadar perkiraan.",
  },
  {
    stepNumber: 5,
    phase: "Hari Rabu 09:00",
    title: "Peringatan Proaktif dari Telegram Bot",
    situation: "Anda sedang di luar rumah membeli kopi, lupa bahwa ada task laporan yang jatuh tempo hari ini.",
    userAction: "Mendengar notifikasi getar di HP, membuka aplikasi Telegram.",
    systemResponse: "Bot @PoppieDipsyBot mengirim pesan: '⚠️ Jatuh Tempo Hari Ini: Kirim Laporan Keuangan Mingguan. Prioritaskan sekarang.'",
    activeFeatures: ["notifications", "insights"],
    lesson: "Sistem aktif menjaga Anda agar tidak pernah lagi mengalami kepanikan akibat deadline terlewat.",
  },
  {
    stepNumber: 6,
    phase: "Hari Jumat 16:00",
    title: "Konsultasi ke Otak Cerdas (Insights)",
    situation: "Menjelang akhir pekan, Anda ingin tahu kondisi produktivitas dan keseimbangan hidup Anda.",
    userAction: "Buka menu /insights. Melihat grafik Life Health Score dan deteksi beban kerja harian.",
    systemResponse: "Insights menampilkan skor 82%. Peringatan: Area Kesehatan minggu ini minim sesi aktivitas. Disarankan istirahat cukup.",
    activeFeatures: ["insights", "areas"],
    lesson: "Produktivitas sejati bukan cuma tentang ngoding nonstop, tapi menjaga seluruh pilar kehidupan tetap sehat.",
  },
  {
    stepNumber: 7,
    phase: "Hari Minggu 20:00",
    title: "Ritual Sakral: Weekly Review",
    situation: "Pekan telah berakhir. Saatnya menutup lembaran minggu ini dengan evaluasi terstruktur.",
    userAction: "Buka menu /review. Isi catatan 'Kemenangan Terbesar', 'Kendala', dan penyesuaian strategi untuk pekan depan.",
    systemResponse: "Sistem mencatat Review Mingguan, mengupdate streak konsistensi, dan merestart kesiapan mental untuk pekan berikutnya.",
    activeFeatures: ["review", "goals"],
    lesson: "Siklus tertutup sempurna: Dari arah hidup di hari Senin, hingga refleksi di hari Minggu malam.",
  },
];
