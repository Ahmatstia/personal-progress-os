"use client";

import { useState } from "react";
import { useToast } from "@/app/components/ui/Toast";

type PreferenceData = {
  theme: "LIGHT" | "DARK" | "SYSTEM";
  weekStartDay: number;
  dailyFocusLimit: number;
  enableNotifications: boolean;
  enableAiAssistance: boolean;
  timezone: string;
};

export function UserPreferenceControls({ initialPref }: { initialPref: PreferenceData }) {
  const { toast } = useToast();
  const [theme, setTheme] = useState(initialPref.theme);
  const [weekStartDay, setWeekStartDay] = useState(initialPref.weekStartDay);
  const [dailyFocusLimit, setDailyFocusLimit] = useState(initialPref.dailyFocusLimit);
  const [enableNotifications, setEnableNotifications] = useState(initialPref.enableNotifications);
  const [saving, setSaving] = useState(false);
  const [testingChannel, setTestingChannel] = useState<"telegram" | "email" | null>(null);

  async function testChannel(channel: "telegram" | "email") {
    setTestingChannel(channel);
    try {
      const res = await fetch("/api/notifications/test-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast(`Notifikasi uji coba ${channel === "telegram" ? "Telegram" : "Email"} berhasil dikirim!`, "success");
      } else {
        const reason = data.details?.reason || data.error || "Gagal mengirimkan notifikasi uji coba";
        if (reason === "TELEGRAM_NOT_CONFIGURED") {
          toast("TELEGRAM_BOT_TOKEN atau TELEGRAM_CHAT_ID belum diatur di .env", "error");
        } else if (reason === "EMAIL_NOT_CONFIGURED" || reason === "RECIPIENT_NOT_CONFIGURED") {
          toast("EMAIL_USER, EMAIL_PASS, atau NOTIFICATION_EMAIL_TO belum diatur di .env", "error");
        } else {
          toast(`Gagal: ${reason}`, "error");
        }
      }
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Terjadi kesalahan jaringan", "error");
    } finally {
      setTestingChannel(null);
    }
  }

  async function updatePref(patch: Partial<PreferenceData>) {
    setSaving(true);
    try {
      const res = await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Gagal memperbarui preferensi");
      toast("Preferensi disimpan", "success");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Gagal memperbarui preferensi", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between py-2 border-b border-surface-150">
        <div>
          <span className="block text-sm font-medium text-surface-800">Tema Tampilan</span>
          <span className="block text-xs text-surface-400">Pilih skema tema warna aplikasi</span>
        </div>
        <select
          value={theme}
          disabled={saving}
          onChange={(e) => {
            const val = e.target.value as "LIGHT" | "DARK" | "SYSTEM";
            setTheme(val);
            updatePref({ theme: val });
          }}
          className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-semibold text-surface-700 focus:outline-none focus:border-primary-500"
        >
          <option value="LIGHT">Terang (LIGHT)</option>
          <option value="DARK">Gelap (DARK)</option>
          <option value="SYSTEM">Sistem (SYSTEM)</option>
        </select>
      </div>

      <div className="flex items-center justify-between py-2 border-b border-surface-150">
        <div>
          <span className="block text-sm font-medium text-surface-800">Mulai Hari Mingguan</span>
          <span className="block text-xs text-surface-400">Hari pertama dalam perhitungan mingguan</span>
        </div>
        <select
          value={weekStartDay}
          disabled={saving}
          onChange={(e) => {
            const val = Number(e.target.value);
            setWeekStartDay(val);
            updatePref({ weekStartDay: val });
          }}
          className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-semibold text-surface-700 focus:outline-none focus:border-primary-500"
        >
          <option value={1}>Senin</option>
          <option value={0}>Minggu</option>
          <option value={6}>Sabtu</option>
        </select>
      </div>

      <div className="flex items-center justify-between py-2 border-b border-surface-150">
        <div>
          <span className="block text-sm font-medium text-surface-800">Batas Task Fokus Harian</span>
          <span className="block text-xs text-surface-400">Jumlah maksimal task fokus per hari</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={20}
            value={dailyFocusLimit}
            disabled={saving}
            onChange={(e) => setDailyFocusLimit(Number(e.target.value))}
            onBlur={() => updatePref({ dailyFocusLimit })}
            className="w-16 rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs text-center font-semibold text-surface-700 focus:outline-none focus:border-primary-500"
          />
          <span className="text-xs text-surface-400">task</span>
        </div>
      </div>

      <div className="flex items-center justify-between py-2 border-b border-surface-150">
        <div>
          <span className="block text-sm font-medium text-surface-800">Notifikasi Proaktif</span>
          <span className="block text-xs text-surface-400">Aktifkan pengingat otomatis untuk tenggat waktu dan jadwal</span>
        </div>
        <input
          type="checkbox"
          checked={enableNotifications}
          disabled={saving}
          onChange={(e) => {
            const val = e.target.checked;
            setEnableNotifications(val);
            updatePref({ enableNotifications: val });
          }}
          className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
        />
      </div>

      {/* Saluran Notifikasi Eksternal (Telegram & Email) */}
      <div className="mt-6 pt-4 border-t border-surface-150">
        <h4 className="text-sm font-semibold text-surface-900 mb-1 flex items-center gap-2">
          <span>🔔 Saluran Notifikasi Eksternal</span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
            Gratis
          </span>
        </h4>
        <p className="text-xs text-surface-500 mb-4">
          Hubungkan pengingat tenggat waktu, fokus harian, dan ringkasan mingguan ke akun Telegram dan Email Anda melalui konfigurasi environment.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Telegram Card */}
          <div className="p-3 rounded-xl border border-surface-200 bg-surface-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-surface-800 flex items-center gap-1.5">
                  <span>✈️</span> Telegram Bot
                </span>
                <span className="text-[10px] text-surface-400 font-mono">100% Free API</span>
              </div>
              <p className="text-[11px] text-surface-500 mb-3 leading-relaxed">
                Kirim pengingat real-time ke akun Telegram Anda via Bot API.
              </p>
            </div>
            <button
              type="button"
              disabled={testingChannel !== null}
              onClick={() => testChannel("telegram")}
              className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {testingChannel === "telegram" ? "Mengirim Tes..." : "Tes Notifikasi Telegram"}
            </button>
          </div>

          {/* Email Card */}
          <div className="p-3 rounded-xl border border-surface-200 bg-surface-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-surface-800 flex items-center gap-1.5">
                  <span>✉️</span> Email (SMTP)
                </span>
                <span className="text-[10px] text-surface-400 font-mono">Gmail / Free Tier</span>
              </div>
              <p className="text-[11px] text-surface-500 mb-3 leading-relaxed">
                Kirim email ringkasan dan peringatan berbobot penting ke kotak masuk Anda.
              </p>
            </div>
            <button
              type="button"
              disabled={testingChannel !== null}
              onClick={() => testChannel("email")}
              className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {testingChannel === "email" ? "Mengirim Tes..." : "Tes Notifikasi Email"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
