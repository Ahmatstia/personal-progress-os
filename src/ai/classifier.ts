import type { Intent, IntentResult } from "./intents";
import { normalizeText } from "./normalization";
import type { IntentClassifier } from "./types";

const phrases: Partial<Record<Exclude<Intent, "UNKNOWN">, string[]>> = {
  TODAY: ["hari ini", "fokus hari", "sekarang harus", "hari ini saya"], NEXT_ACTION: ["selanjutnya", "next action", "harus saya kerjakan", "langkah berikut"], GOAL_STATUS: ["status goal", "status tujuan", "progres goal", "kondisi goal"], TASK_STATUS: ["status task", "status tugas", "tugas ini bagaimana"], TASK_SEARCH: ["cari task", "cari tugas", "temukan tugas", "ada tugas"], PROGRESS: ["progres", "kemajuan", "perkembangan", "sudah sampai"], ANALYTICS: ["analitik", "analytics", "statistik", "data aktivitas"], STREAK: ["streak", "hari berturut", "konsisten", "beruntun"], TIME_SPENT: ["berapa lama", "waktu yang dipakai", "jam kerja", "waktu belajar"], COMPLETION: ["berapa yang selesai", "tingkat penyelesaian", "completion", "tugas selesai"], BOTTLENECK: ["bottleneck", "hambatan utama", "yang menghambat", "tersendat"], REVIEW: ["review", "tinjau minggu", "ulasan", "evaluasi minggu"], REFLECTION: ["refleksi", "apa yang sulit", "apa yang berjalan baik", "renungkan"], GOAL_CREATE: ["buat goal", "tambah tujuan", "goal baru", "membuat target"], TASK_CREATE: ["buat task", "tambah tugas", "tugas baru", "membuat pekerjaan"], TASK_COMPLETE: ["selesaikan task", "tandai selesai", "selesaikan tugas", "centang tugas"], TASK_REOPEN: ["buka kembali", "reopen task", "aktifkan lagi", "tugas yang dibuka"], SESSION_START: ["mulai sesi", "start session", "mulai bekerja", "mulai belajar"], SESSION_END: ["akhiri sesi", "selesaikan sesi", "stop sesi", "berhenti bekerja"], FOCUS: ["fokus", "tambahkan ke fokus", "prioritas hari ini", "focus task"], OVERDUE: ["terlambat", "overdue", "jatuh tempo", "melewati tenggat"], MOTIVATION: ["motivasi", "semangat", "dorongan", "menyerah"], HELP: ["bantuan", "help", "cara memakai", "apa saja yang bisa"]
};

export class BaselineClassifier implements IntentClassifier {
  classify(text: string): IntentResult {
    const normalizedText = normalizeText(text);
    if (!normalizedText) return { intent: "UNKNOWN", confidence: 0, normalizedText, entities: [], source: "baseline" };
    const scores = Object.entries(phrases).map(([intent, words]) => ({ intent: intent as Intent, score: (words ?? []).reduce((sum, phrase) => sum + (normalizedText.includes(phrase) ? (phrase.includes(" ") ? 0.35 : 0.2) : 0), 0) }));
    scores.sort((left, right) => right.score - left.score);
    const winner = scores[0];
    const confidence = winner.score === 0 ? 0 : Number(Math.min(0.99, 0.7 + winner.score * 0.2).toFixed(2));
    return { intent: confidence < 0.55 ? "UNKNOWN" : winner.intent, confidence, normalizedText, entities: [], source: "baseline" };
  }
}

export const baselineClassifier = new BaselineClassifier();
