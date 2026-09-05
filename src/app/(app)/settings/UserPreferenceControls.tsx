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
    </div>
  );
}
