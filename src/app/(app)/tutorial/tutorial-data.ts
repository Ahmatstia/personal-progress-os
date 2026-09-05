export interface UserNeedGuide {
  id: string;
  icon: string;
  userGoal: string; // "Saya ingin..."
  problemSolved: string; // Masalah apa yang diselesaikan
  recommendedFeature: string; // Fitur yang harus dibuka
  route: string;
  color: string;
  howToSteps: string[];
  whyThisFeature: string;
  connectedTo: string; // Hubungannya dengan fitur lain
}

export interface FeatureGuideItem {
  id: string;
  menuName: string;
  badge: string;
  icon: string;
  route: string;
  simpleExplanation: string; // Penjelasan bahasa manusia biasa
  whatYouCanDo: string[]; // Apa saja yang bisa Anda lakukan di sini
  stepByStep: string[]; // Cara pakainya langkah demi langkah
  tips: string;
}

export interface DailyWorkflowPhase {
  time: string;
  phaseName: string;
  icon: string;
  whatYouFeel: string; // Kondisi user
  whatYouShouldDo: string; // Apa yang harus dilakukan
  menuToOpen: string;
  route: string;
  explanation: string;
}

export interface FeatureConnectionExplainer {
  id: string;
  title: string;
  icon: string;
  analogy: string; // Analogi yang gampang dipahami
  step1: { name: string; action: string };
  step2: { name: string; action: string };
  howTheyHelpYou: string;
  practicalExample: string;
}

// ==============================================================================
// 1. PANDUAN BERDASARKAN NIAT / KEBUTUHAN PENGGUNA ("SAYA INGIN...")
// ==============================================================================
export const USER_NEEDS_GUIDES: UserNeedGuide[] = [
  {
    id: "need-life-plan",
    icon: "🧭",
    userGoal: "Saya ingin merancang arah dan tujuan hidup jangka panjang",
    problemSolved: "Sering merasa hidup jalan di tempat, bingung arah masa depan, atau tidak tahu prioritas hidup apa yang sedang diperjuangkan.",
    recommendedFeature: "Areas (Pilar Hidup) & Goals (Target Impian)",
    route: "/areas",
    color: "from-violet-500/20 to-purple-500/10 border-violet-500/30 text-violet-300",
    whyThisFeature: "Area adalah fondasi abadi hidup Anda (seperti Kesehatan, Karier, Finansial, Hubungan), sedangkan Goal adalah target spesifik yang ingin Anda capai di pilar tersebut.",
    howToSteps: [
      "Buka menu 'Areas', buat 4-6 pilar utama hidup Anda (misal: Karier, Kesehatan, Finansial).",
      "Buka menu 'Goals', lalu buat target impian yang ingin Anda capai dalam 3-12 bulan ke depan.",
      "Tautkan setiap Goal ke salah satu Area agar semua target Anda punya rumah yang jelas.",
      "Pecah Goal menjadi beberapa tahapan (Stages) agar target besar tidak terasa menakutkan.",
    ],
    connectedTo: "Nantinya, setiap tahapan di Goal akan Anda pecah menjadi tugas-tugas kecil di menu 'Tasks' untuk dikerjakan sehari-hari.",
  },
  {
    id: "need-manage-projects",
    icon: "📦",
    userGoal: "Saya punya proyek penting dengan tenggat waktu / deadline pasti",
    problemSolved: "Proyek besar sering molor, kewalahan membagi pekerjaan, atau lupa batas waktu pengerjaan.",
    recommendedFeature: "Projects (Inisiatif & Proyek)",
    route: "/projects",
    color: "from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-300",
    whyThisFeature: "Menu Project dirancang khusus untuk pekerjaan yang punya batas waktu jelas dan hasil akhir yang nyata (misal: Merilis Website Baru, Menulis Buku, Renovasi Rumah).",
    howToSteps: [
      "Buka menu 'Projects', klik 'Tambah Proyek Baru'.",
      "Tentukan batas waktu (Deadline) kapan proyek ini harus selesai.",
      "Buat checkpoint capaian ('Milestones') sebagai penanda progres.",
      "Tambahkan daftar tugas konkret yang dibutuhkan untuk menyelesaikan tiap checkpoint.",
    ],
    connectedTo: "Tugas di dalam Proyek akan otomatis muncul di menu 'Hari Ini' saat tanggal deadline mendekat.",
  },
  {
    id: "need-daily-tasks",
    icon: "✅",
    userGoal: "Saya ingin mengatur dan menyelesaikan tugas-tugas harian saya",
    problemSolved: "Punya banyak tugas tapi bingung mulai dari mana, atau sering menunda-nunda sampai menumpuk.",
    recommendedFeature: "Hari Ini & Fokus Harian",
    route: "/today",
    color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-300",
    whyThisFeature: "Menu 'Hari Ini' memperlihatkan semua tugas yang relevan, sedangkan 'Fokus Harian' membantu Anda menyaring hanya 3 tugas paling penting agar tidak pusing.",
    howToSteps: [
      "Buka menu 'Hari Ini' untuk mencatat tugas baru lengkap dengan perkiraan waktu pengerjaannya.",
      "Buka menu 'Fokus Harian' (/focus), lalu pilih 3 tugas paling utama untuk hari ini.",
      "Fokus kerjakan 3 tugas tersebut satu per satu sampai selesai.",
      "Centang tugas saat selesai untuk mencatat kemajuan Anda.",
    ],
    connectedTo: "Saat Anda mengerjakan tugas, Anda bisa menyalakan timer Pomodoro agar waktu kerja Anda tercatat otomatis.",
  },
  {
    id: "need-quick-capture",
    icon: "💡",
    userGoal: "Tiba-tiba terpikir ide atau teringat tugas mendadak di tengah jalan",
    problemSolved: "Ide cemerlang hilang karena tidak sempat dicatat, atau fokus terganggu karena langsung mengerjakan hal lain yang tiba-tiba teringat.",
    recommendedFeature: "Inbox Catatan (Capture)",
    route: "/capture",
    color: "from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-300",
    whyThisFeature: "Tempat pembuangan cepat (Quick Brain Dump). Catat apapun dalam 5 detik agar pikiran Anda kembali plong, lalu rapikan nanti.",
    howToSteps: [
      "Buka 'Inbox Catatan' (/capture).",
      "Ketik ide, catatan, atau pengingat singkat (misal: 'Ingat beli kado adik', 'Ide konten tutorial').",
      "Klik Simpan, lalu langsung kembali ke pekerjaan Anda tanpa terdistraksi.",
      "Di sore hari atau saat santai, buka kembali menu ini dan klik 'Konversi' untuk mengubah catatan tersebut jadi Tugas atau Target resmi.",
    ],
    connectedTo: "Catatan mentah di Inbox bisa dikonversi menjadi Task, Goal, atau Project hanya dengan 1 klik.",
  },
  {
    id: "need-deep-focus",
    icon: "⏱️",
    userGoal: "Saya ingin bekerja dengan konsentrasi penuh tanpa gangguan",
    problemSolved: "Sering terdistraksi medsos, sulit mulai kerja, atau tidak tahu berapa lama waktu yang sebenarnya dihabiskan untuk bekerja.",
    recommendedFeature: "Pomodoro Timer (Panel Fokus)",
    route: "/focus",
    color: "from-rose-500/20 to-red-500/10 border-rose-500/30 text-rose-300",
    whyThisFeature: "Metode Pomodoro membagi kerja ke dalam ritme 25 menit fokus penuh dan 5 menit istirahat, sehingga otak tetap segar dan tidak cepat lelah.",
    howToSteps: [
      "Pilih 1 tugas yang ingin Anda selesaikan di panel Pomodoro.",
      "Klik tombol 'Mulai Sesi' (timer 25 menit akan berjalan).",
      "Tutup semua tab media sosial dan kerjakan tugas tersebut sampai timer berbunyi.",
      "Ambil istirahat singkat 5 menit untuk minum atau peregangan.",
      "Ulangi siklus ini. Sistem otomatis merekam total jam fokus Anda ke dalam database.",
    ],
    connectedTo: "Menit fokus yang terekam akan menjadi bahan laporan di Analitik dan Evaluasi Mingguan.",
  },
  {
    id: "need-schedule",
    icon: "📅",
    userGoal: "Saya ingin mengatur jadwal kegiatan dan melihat agenda waktu",
    problemSolved: "Jadwal rapat bertabrakan dengan waktu kerja, atau lupa agenda penting yang sudah direncanakan.",
    recommendedFeature: "Kalender & Aktivitas",
    route: "/calendar",
    color: "from-sky-500/20 to-indigo-500/10 border-sky-500/30 text-sky-300",
    whyThisFeature: "Membedakan apa yang Anda rencanakan di masa depan (Kalender) dengan apa yang sebenarnya Anda lakukan di masa lalu (Aktivitas).",
    howToSteps: [
      "Buka 'Kalender' (/calendar) untuk memplot blok waktu kegiatan (misal: 'Rapat Tim jam 10:00', 'Waktu Olahraga jam 17:00').",
      "Sistem akan memeriksa jika ada jadwal kerja yang bertabrakan dengan tenggat waktu tugas.",
      "Buka 'Aktivitas' (/activity) untuk melihat buku harian otomatis tentang kegiatan apa saja yang berhasil diselesaikan.",
    ],
    connectedTo: "Sistem cerdas di menu Insights akan memberi peringatan jika jadwal kalender Anda terlalu padat.",
  },
  {
    id: "need-priority-help",
    icon: "🔮",
    userGoal: "Saya bingung harus mengerjakan apa dulu hari ini",
    problemSolved: "Pusing melihat puluhan tugas menumpuk dan bingung mana yang paling mendesak dan penting.",
    recommendedFeature: "Insights (Rekomendasi Cerdas)",
    route: "/insights",
    color: "from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-300",
    whyThisFeature: "Otak cerdas sistem menganalisis seluruh tugas, tenggat waktu, dan pilar hidup Anda untuk memberikan rekomendasi urutan prioritas yang masuk akal.",
    howToSteps: [
      "Buka menu 'Insights' (/insights).",
      "Lihat kartu 'Perlu Perhatian': Tugas atau hal paling genting yang membutuhkan tindakan Anda segera.",
      "Cek 'Peringkat Prioritas': Sistem mengurutkan tugas dari yang paling krusial lengkap dengan alasannya.",
      "Lihat skor 'Keseimbangan Hidup (Life Health)' untuk memastikan Anda tidak mengabaikan kesehatan.",
    ],
    connectedTo: "Gunakan rekomendasi prioritas ini saat memilih tugas untuk menu Fokus Harian.",
  },
  {
    id: "need-weekly-eval",
    icon: "🪞",
    userGoal: "Saya ingin mengevaluasi kemajuan saya dan merencanakan pekan depan",
    problemSolved: "Bekerja terus-menerus tapi merasa tidak ada hasil, atau mengulangi kesalahan yang sama setiap minggu.",
    recommendedFeature: "Refleksi (Review Mingguan)",
    route: "/review",
    color: "from-fuchsia-500/20 to-rose-500/10 border-fuchsia-500/30 text-fuchsia-300",
    whyThisFeature: "Ritual akhir pekan selama 10 menit untuk merayakan keberhasilan, belajar dari kendala, dan menata energi untuk minggu berikutnya.",
    howToSteps: [
      "Setiap akhir pekan (Jumat sore atau Minggu malam), buka menu 'Refleksi' (/review).",
      "Tinjau rangkuman otomatis: berapa jam Anda fokus dan berapa tugas yang selesai.",
      "Jawab pertanyaan refleksi sederhana: Apa pencapaian terbaik Anda? Apa kendala yang dialami?",
      "Tuliskan penyesuaian strategi agar minggu depan berjalan lebih tenang dan produktif.",
    ],
    connectedTo: "Hasil refleksi akan memperbarui streak konsistensi dan mereset kesiapan mental Anda.",
  },
];

// ==============================================================================
// 2. PENJELASAN SETIAP MENU DALAM BAHASA MANUSIA BIASA
// ==============================================================================
export const MENU_EXPLANATIONS: FeatureGuideItem[] = [
  {
    id: "menu-home",
    menuName: "Beranda (Home)",
    badge: "Pusat Kontrol",
    icon: "🧭",
    route: "/",
    simpleExplanation: "Dashboard utama tempat Anda melihat rangkuman hari ini dalam satu layar pandang: fokus utama, progres impian, dan sorotan tindakan selanjutnya.",
    whatYouCanDo: [
      "Melihat aksi terpenting yang harus Anda lakukan sekarang (Next Action Spotlight).",
      "Memantau persentase kemajuan target-target besar Anda.",
      "Melihat statistik ringkas waktu fokus dan tugas yang sudah selesai.",
    ],
    stepByStep: [
      "Buka Beranda setiap kali Anda menyalakan aplikasi.",
      "Perhatikan kotak 'Next Action Spotlight' untuk langsung tahu apa yang harus dieksekusi.",
      "Klik tombol tugas terkait untuk langsung mulai bekerja.",
    ],
    tips: "Jadikan Beranda sebagai halaman berlabuh pertama Anda setiap hari.",
  },
  {
    id: "menu-today",
    menuName: "Hari Ini (Today)",
    badge: "Daftar Kerja",
    icon: "☀️",
    route: "/today",
    simpleExplanation: "Daftar seluruh tugas yang harus atau bisa Anda kerjakan hari ini. Ini adalah buku to-do list harian Anda yang terstruktur rapi.",
    whatYouCanDo: [
      "Menambah tugas baru yang ingin dikerjakan hari ini.",
      "Melihat tugas yang sudah lewat batas waktu (Overdue) agar segera dibereskan.",
      "Menandai tugas yang sudah selesai.",
    ],
    stepByStep: [
      "Buka menu 'Hari Ini'.",
      "Ketik judul tugas baru di form input atas dan beri estimasi waktu (misal: 1 jam).",
      "Centang kotak tugas jika sudah selesai dikerjakan.",
    ],
    tips: "Tuliskan tugas dengan awalan kata kerja spesifik (contoh: 'Kirim email laporan ke Pak Budi', bukan sekadar 'Email').",
  },
  {
    id: "menu-focus",
    menuName: "Fokus Harian (Daily Focus)",
    badge: "Anti-Burnout",
    icon: "🎯",
    route: "/focus",
    simpleExplanation: "Filter khusus yang membatasi Anda hanya memilih 3 sampai 5 tugas terpenting untuk hari ini. Membantu Anda berhenti merasa cemas melihat puluhan to-do list.",
    whatYouCanDo: [
      "Memilih maksimal 3-5 tugas utama dari bank to-do Anda.",
      "Menjalankan sesi kerja Pomodoro langsung pada tugas yang dipilih.",
      "Menyelesaikan hari dengan perasaan puas karena target kunci tercapai.",
    ],
    stepByStep: [
      "Buka menu 'Fokus Harian' di pagi hari.",
      "Pilih 3 tugas paling krusial untuk hari ini.",
      "Abaikan tugas lainnya sebelum 3 tugas ini beres.",
    ],
    tips: "3 tugas selesai dengan tuntas jauh lebih berharga daripada mengerjakan 10 tugas tapi tidak ada yang selesai.",
  },
  {
    id: "menu-capture",
    menuName: "Inbox Catatan (Capture)",
    badge: "Otak Eksternal",
    icon: "📥",
    route: "/capture",
    simpleExplanation: "Tempat mencatat kilat segala ide, pikiran melayang, atau tugas mendadak. Menyimpan ide dalam 5 detik agar pikiran Anda tidak terpecah saat bekerja.",
    whatYouCanDo: [
      "Mencatat ide liar, link bacaan, atau tugas mendadak seketika.",
      "Mengonversi catatan mentah menjadi Tugas, Proyek, atau Target resmi.",
      "Mengosongkan isi kepala dari beban mengingat-ingat hal kecil.",
    ],
    stepByStep: [
      "Ketik apapun yang melintas di pikiran Anda di form input.",
      "Pilih kategori singkat: Catatan, Ide, atau Tugas.",
      "Klik Simpan. Buka kembali di sore hari untuk dirapikan.",
    ],
    tips: "Jangan pernah biarkan ide hanya mengendap di kepala. Tuliskan di sini segera!",
  },
  {
    id: "menu-areas",
    menuName: "Areas (Pilar Hidup)",
    badge: "Kompas Hidup",
    icon: "🧭",
    route: "/areas",
    simpleExplanation: "Fondasi jangka panjang hidup Anda yang tidak ada tanggal kedaluwarsanya. Contoh pilar: Karier, Kesehatan, Finansial, Hubungan Keluarga, dan Hobi.",
    whatYouCanDo: [
      "Membuat pilar-pilar penting dalam hidup Anda.",
      "Melihat proyek dan target apa saja yang berjalan di bawah tiap pilar.",
      "Memastikan Anda tidak melupakan pilar penting (misal: sibuk karier tapi kesehatan terlantar).",
    ],
    stepByStep: [
      "Buat 4 sampai 6 Area utama hidup Anda.",
      "Gunakan Area ini sebagai wadah saat membuat Target (Goals) atau Proyek baru.",
    ],
    tips: "Area tidak pernah selesai (Completed). Pilar hidup dirawat seumur hidup.",
  },
  {
    id: "menu-goals",
    menuName: "Goals (Target Impian)",
    badge: "Tujuan Besar",
    icon: "🚩",
    route: "/goals",
    simpleExplanation: "Target besar yang ingin Anda capai dalam hitungan bulan atau tahun. Setiap Goal memiliki tahapan (Stages) agar mudah dicicil.",
    whatYouCanDo: [
      "Membuat target jangka panjang dan menautkannya ke Area hidup.",
      "Membagi target besar menjadi beberapa tahapan (Stages).",
      "Melihat persentase progres yang otomatis bertambah saat tugas di dalamnya selesai.",
    ],
    stepByStep: [
      "Klik 'Buat Goal Baru', tuliskan impian Anda (misal: 'Kuasai Pemrograman Web').",
      "Pilih Area terkait (misal: Area 'Karier').",
      "Buat tahapan di dalamnya: Tahap 1 (Dasar), Tahap 2 (Proyek Nyata).",
    ],
    tips: "Beri nama Goal yang menggugah semangat dan jelas kriterianya.",
  },
  {
    id: "menu-projects",
    menuName: "Projects (Proyek Kerja)",
    badge: "Deadline Pasti",
    icon: "📁",
    route: "/projects",
    simpleExplanation: "Pekerjaan khusus yang memiliki batas waktu (deadline) pasti dan hasil akhir konkret. Contoh: 'Membuat Website Portofolio' atau 'Mempersiapkan Pernikahan'.",
    whatYouCanDo: [
      "Menentukan tanggal deadline akhir proyek.",
      "Membuat pos checkpoint (Milestones) agar proyek terarah.",
      "Mengumpulkan semua tugas yang dibutuhkan untuk menyelesaikan proyek tersebut.",
    ],
    stepByStep: [
      "Buat Proyek baru dan pasang batas tanggal penyelesaian.",
      "Tambahkan Milestone sebagai penanda langkah penting.",
      "Masukkan tugas-tugas detail di bawah proyek ini.",
    ],
    tips: "Jika suatu pekerjaan butuh lebih dari 3 tugas dan ada tanggal deadline, jadikan Proyek!",
  },
  {
    id: "menu-calendar",
    menuName: "Kalender & Aktivitas",
    badge: "Alokasi Waktu",
    icon: "📅",
    route: "/calendar",
    simpleExplanation: "Melihat jadwal dan memplot blok waktu kegiatan Anda. Menghubungkan tugas dengan alokasi jam kerja nyata di kehidupan sehari-hari.",
    whatYouCanDo: [
      "Menjadwalkan agenda penting dan rapat.",
      "Mengamankan blok waktu untuk fokus bekerja (Time Blocking).",
      "Melihat log riwayat apa saja yang sudah Anda kerjakan di masa lalu.",
    ],
    stepByStep: [
      "Klik tanggal dan jam di kalender untuk menambahkan agenda.",
      "Sistem akan memperingatkan jika ada tugas deadline yang berdekatan dengan jadwal Anda.",
    ],
    tips: "Sisakan ruang jeda di kalender untuk istirahat dan hal-hal tak terduga.",
  },
  {
    id: "menu-insights",
    menuName: "Insights (Otak Cerdas)",
    badge: "Analisis Logis",
    icon: "✨",
    route: "/insights",
    simpleExplanation: "Pusat kecerdasan sistem yang membaca semua data Anda: memberi rekomendasi tugas apa yang harus didahulukan, mendeteksi jadwal tabrakan, dan menilai keseimbangan hidup.",
    whatYouCanDo: [
      "Melihat tugas yang paling membutuhkan perhatian Anda (Needs Attention).",
      "Melihat urutan prioritas tugas berdasarkan hitungan deadline dan dampak.",
      "Memantau grafik skor keseimbangan hidup Anda (Life Health).",
    ],
    stepByStep: [
      "Buka menu Insights saat Anda bingung menentukan prioritas.",
      "Ikuti saran urutan tugas yang dihitung oleh sistem.",
    ],
    tips: "Cek bagian 'Deteksi Konflik' untuk menghindari stres akibat deadline yang mepet.",
  },
  {
    id: "menu-review",
    menuName: "Refleksi (Review Mingguan)",
    badge: "Evaluasi Diri",
    icon: "🪞",
    route: "/review",
    simpleExplanation: "Buku catatan evaluasi akhir pekan untuk merenungkan apa yang berjalan lancar, apa yang terhambat, dan bagaimana memperbaikinya minggu depan.",
    whatYouCanDo: [
      "Melihat total jam fokus dan tugas yang berhasil diselesaikan pekan ini.",
      "Mencatat pelajaran penting dan rasa syukur atas pencapaian.",
      "Merancang rencana perbaikan untuk minggu berikutnya.",
    ],
    stepByStep: [
      "Luangkan 10 menit di hari Jumat sore atau Minggu malam.",
      "Jawab pertanyaan refleksi sederhana dan simpan.",
    ],
    tips: "Konsistensi refleksi mingguan adalah rahasia orang-orang yang terus bertumbuh.",
  },
  {
    id: "menu-notifications",
    menuName: "Notifikasi & Pengingat",
    badge: "Pengingat Aktif",
    icon: "🔔",
    route: "/notifications",
    simpleExplanation: "Pusat notifikasi yang mengingatkan Anda sebelum deadline terlambat, jadwal agenda yang mendekat, serta terhubung langsung ke Telegram pribadi Anda.",
    whatYouCanDo: [
      "Melihat daftar pengingat tugas yang jatuh tempo hari ini.",
      "Menerima peringatan otomatis langsung di aplikasi dan di Telegram.",
      "Mengaktifkan Jam Tenang agar Anda tidak terganggu saat jam tidur.",
    ],
    stepByStep: [
      "Buka menu Notifikasi untuk melihat pengingat yang belum dibaca.",
      "Atur jam tenang di menu Pengaturan jika diperlukan.",
    ],
    tips: "Hubungkan dengan bot Telegram agar Anda tetap diingatkan meskipun sedang tidak membuka laptop.",
  },
];

// ==============================================================================
// 3. CARA FITUR-FITUR SALING BEKERJA SAMA (HUBUNGAN TIMBAL BALIK)
// ==============================================================================
export const FEATURE_CONNECTIONS: FeatureConnectionExplainer[] = [
  {
    id: "conn-area-goal-task",
    title: "Alur Besar: Dari Impian Hidup sampai Tugas Nyata",
    icon: "🌳",
    analogy: "Ibarat Pohon: Area adalah Akar, Goal adalah Batang, Tahapan adalah Ranting, dan Task adalah Daun yang Anda siram setiap hari.",
    step1: {
      name: "Area ➡️ Goal",
      action: "Anda menentukan pilar hidup (Area), lalu membuat target besar (Goal) di bawah pilar tersebut.",
    },
    step2: {
      name: "Goal ➡️ Task ➡️ Progress",
      action: "Goal dipecah jadi tugas-tugas kecil (Task). Setiap kali Anda menyelesaikan tugas, persentase kemajuan Goal otomatis bertambah!",
    },
    howTheyHelpYou: "Anda tidak akan pernah merasa 'mengerjakan tugas yang sia-sia', karena setiap centang tugas yang Anda buat langsung mendorong tercapainya impian hidup Anda.",
    practicalExample: "Area: Karier ➡️ Goal: Kuasai Next.js ➡️ Task: Latihan bikin halaman dashboard ➡️ Goal Anda naik jadi 40%!",
  },
  {
    id: "conn-capture-to-task",
    title: "Alur Ide: Dari Catatan Spontan Menjadi Tindakan Resmi",
    icon: "⚡",
    analogy: "Ibarat Keranjang Belanja: Anda melempar barang ke keranjang dulu (Capture), baru disortir ke lemari yang tepat saat sampai di rumah (Convert).",
    step1: {
      name: "Tulis Kilat di Inbox",
      action: "Saat lagi kerja dan teringat sesuatu, catat dalam 5 detik di /capture. Jangan langsung dikerjakan agar fokus tidak buyar.",
    },
    step2: {
      name: "Konversi ke Tugas Resmi",
      action: "Sore hari, buka Inbox dan tekan tombol 'Konversi'. Ubah catatan itu jadi Task dengan deadline dan prioritas yang jelas.",
    },
    howTheyHelpYou: "Pikiran Anda selalu tenang dan jernih saat bekerja, tanpa takut ada ide cemerlang yang kelupaan.",
    practicalExample: "Lagi ngoding teringat 'Servis motor' ➡️ Ketik di Capture ➡️ Sore hari dikonversi jadi Task di Area Pribadi.",
  },
  {
    id: "conn-task-focus-pomodoro",
    title: "Alur Eksekusi: Dari Daftar Tugas Menjadi Jam Kerja Nyata",
    icon: "🔥",
    analogy: "Ibarat Restoran: Task adalah Buku Menu, Daily Focus adalah Makanan yang Dipesan, dan Pomodoro adalah Proses Memasaknya.",
    step1: {
      name: "Pilih 3 Tugas Terpenting",
      action: "Dari puluhan to-do list, pilih HANYA 3 tugas di menu Fokus Harian (/focus).",
    },
    step2: {
      name: "Nyalakan Timer Pomodoro",
      action: "Kerjakan tugas dengan interval fokus 25 menit. Sistem otomatis mencatat menit kerja Anda ke dalam database.",
    },
    howTheyHelpYou: "Mencegah rasa kewalahan melihat daftar tugas yang panjang dan membuktikan bahwa Anda benar-benar bekerja secara terukur.",
    practicalExample: "Pilih Task 'Buat Laporan Bulanan' ➡️ Jalankan 2 sesi Pomodoro (50 menit) ➡️ Laporan selesai dan 50 menit fokus tercatat!",
  },
  {
    id: "conn-sessions-to-review",
    title: "Alur Refleksi: Dari Jam Kerja Menjadi Pertumbuhan Diri",
    icon: "📈",
    analogy: "Ibarat Spedometer Kendaraan: Sesi fokus mencatat jarak tempuh Anda, sedangkan Review adalah waktu servis untuk mengecek performa mesin.",
    step1: {
      name: "Menit Fokus Terkumpul",
      action: "Semua sesi kerja Pomodoro dan tugas selesai sepanjang minggu dirangkum otomatis oleh sistem.",
    },
    step2: {
      name: "Refleksi Akhir Pekan",
      action: "Buka menu /review di akhir pekan untuk melihat total jam kerja dan merenungkan apa yang perlu diperbaiki minggu depan.",
    },
    howTheyHelpYou: "Anda bisa melihat bukti nyata kemajuan Anda setiap minggu, sehingga rasa percaya diri dan motivasi Anda terus meningkat.",
    practicalExample: "Sistem merangkum: Minggu ini Anda berhasil fokus selama 15 jam dan menyelesaikan 12 tugas penting.",
  },
  {
    id: "conn-insights-telegram",
    title: "Alur Pengingat Cerdas: Dari Analisis Menjadi Peringatan di Ponsel",
    icon: "📱",
    analogy: "Ibarat Asisten Pribadi: Sistem memantau jadwal dan deadline Anda di balik layar, lalu menepuk pundak Anda di Telegram saat ada hal mendesak.",
    step1: {
      name: "Analisis Otomatis",
      action: "Sistem mendeteksi bahwa hari ini ada tugas penting yang jatuh tempo atau Anda belum mencatat refleksi mingguan.",
    },
    step2: {
      name: "Kirim Pesan ke Telegram",
      action: "Bot Telegram mengirim pesan pengingat langsung ke layar HP Anda secara instan.",
    },
    howTheyHelpYou: "Anda tidak perlu terus-menerus cemas memeriksa aplikasi. Sistem yang akan proaktif mengingatkan Anda saat dibutuhkan.",
    practicalExample: "Jam 09:00 pagi HP Anda berbunyi: '⚠️ Pengingat: Tugas Laporan Pajak jatuh tempo hari ini!'.",
  },
];

// ==============================================================================
// 4. WORKFLOW HARIAN IDEAL (DARI BANGUN TIDUR SAMPAI AKHIR PEKAN)
// ==============================================================================
export const DAILY_WORKFLOW: DailyWorkflowPhase[] = [
  {
    time: "Pagi Hari (08:00 - 08:30)",
    phaseName: "1. Menentukan Arah & 3 Fokus Utama",
    icon: "☀️",
    whatYouFeel: "Baru bangun atau baru di depan meja kerja, siap memulai hari tapi butuh kejelasan apa yang harus dibereskan.",
    whatYouShouldDo: "Buka menu 'Fokus Harian' (/focus). Pilih 3 tugas paling penting yang jika 3 tugas ini selesai, hari Anda dianggap sukses.",
    menuToOpen: "Fokus Harian",
    route: "/focus",
    explanation: "Jangan buka to-do list panjang di pagi hari. Kunci pikiran Anda hanya pada 3 hal penting agar tidak stres.",
  },
  {
    time: "Siang Hari (09:00 - 16:00)",
    phaseName: "2. Eksekusi Deep Work & Tangkap Distraksi",
    icon: "⚡",
    whatYouFeel: "Sedang sibuk bekerja, sesekali muncul ide liar atau teringat tugas mendadak yang mengganggu konsentrasi.",
    whatYouShouldDo: "Nyalakan timer Pomodoro untuk fokus 25 menit. Jika ada ide atau tugas mendadak melintas, catat kilat di 'Inbox Catatan' (/capture) lalu lanjutkan kerja.",
    menuToOpen: "Inbox Catatan & Pomodoro",
    route: "/capture",
    explanation: "Lindungi waktu fokus Anda. Jangan biarkan ide spontan merusak alur kerja yang sedang berjalan.",
  },
  {
    time: "Sore Hari (16:30 - 17:00)",
    phaseName: "3. Rapikan Inbox & Bersihkan Meja Kerja",
    icon: "🌆",
    whatYouFeel: "Energi kerja mulai menurun, tugas utama sudah selesai, saatnya merapikan catatan sebelum istirahat.",
    whatYouShouldDo: "Buka 'Inbox Catatan' (/capture). Konversi ide atau catatan mentah tadi menjadi tugas resmi untuk hari esok atau masukkan ke proyek terkait.",
    menuToOpen: "Inbox Catatan",
    route: "/capture",
    explanation: "Menutup hari dengan 'Inbox Zero' membuat Anda bisa beristirahat di malam hari dengan tenang tanpa beban pikiran.",
  },
  {
    time: "Akhir Pekan (Jumat / Minggu Malam)",
    phaseName: "4. Ritual Refleksi & Merestart Energi",
    icon: "🪞",
    whatYouFeel: "Satu pekan penuh telah berlalu, ingin melihat hasil perjuangan dan bersiap menghadapi pekan depan.",
    whatYouShouldDo: "Buka menu 'Refleksi' (/review). Jawab pertanyaan evaluasi singkat selama 10 menit untuk merayakan kemenangan dan memperbaiki kekurangan.",
    menuToOpen: "Refleksi (Review)",
    route: "/review",
    explanation: "Refleksi mingguan memastikan hidup Anda tidak cuma sibuk, tapi benar-benar bergerak maju ke arah yang benar.",
  },
];
