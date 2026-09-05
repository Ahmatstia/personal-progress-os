"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/app/components/ui/Icon";
import { useToast } from "@/app/components/ui/Toast";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: "TASK_DUE" | "DAILY_FOCUS_REMINDER" | "WEEKLY_REVIEW_REMINDER" | "CALENDAR_EVENT" | "MILESTONE_DEADLINE" | "SYSTEM";
  severity: "INFO" | "WARNING" | "URGENT";
  isRead: boolean;
  readAt: string | null;
  linkUrl: string | null;
  createdAt: string;
};

export function NotificationCenter({
  initialNotifications,
  initialUnreadCount,
}: {
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
}) {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "URGENT">("ALL");
  const [loading, setLoading] = useState(false);
  const [cycling, setCycling] = useState(false);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=50");
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data);
        const unread = (json.data as NotificationItem[]).filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch {
      toast("Gagal memuat notifikasi", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(id: string) {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        toast("Ditandai sebagai telah dibaca", "success");
      }
    } catch {
      toast("Gagal memperbarui notifikasi", "error");
    }
  }

  async function handleMarkAllAsRead() {
    try {
      const res = await fetch("/api/notifications/read-all", { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
        toast("Semua notifikasi ditandai dibaca", "success");
      }
    } catch {
      toast("Gagal memperbarui notifikasi", "error");
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        const deleted = notifications.find((n) => n.id === id);
        if (deleted && !deleted.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        toast("Notifikasi dihapus", "info");
      }
    } catch {
      toast("Gagal menghapus notifikasi", "error");
    }
  }

  async function handleTriggerReminders() {
    setCycling(true);
    try {
      const res = await fetch("/api/notifications/reminders/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceIgnoreQuietHours: true }),
      });
      const json = await res.json();
      if (json.success) {
        toast(`Pemeriksaan selesai: ${json.data.createdCount} pengingat baru dibuat`, "success");
        await fetchNotifications();
      }
    } catch {
      toast("Gagal menjalankan pemeriksaan pengingat", "error");
    } finally {
      setCycling(false);
    }
  }

  const filtered = notifications.filter((n) => {
    if (filter === "UNREAD") return !n.isRead;
    if (filter === "URGENT") return n.severity === "URGENT" || n.severity === "WARNING";
    return true;
  });

  function getSeverityBadge(severity: string) {
    switch (severity) {
      case "URGENT":
        return <span className="rounded-md bg-danger-100 px-2 py-0.5 text-[10px] font-bold text-danger-700">PENTING / URGENT</span>;
      case "WARNING":
        return <span className="rounded-md bg-warning-100 px-2 py-0.5 text-[10px] font-semibold text-warning-700">PERINGATAN</span>;
      default:
        return <span className="rounded-md bg-primary-100 px-2 py-0.5 text-[10px] font-medium text-primary-700">INFO</span>;
    }
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case "TASK_DUE":
        return "layers";
      case "CALENDAR_EVENT":
        return "calendar";
      case "DAILY_FOCUS_REMINDER":
        return "target";
      case "WEEKLY_REVIEW_REMINDER":
        return "capture";
      default:
        return "bell";
    }
  }

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-200/60 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("ALL")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === "ALL"
                ? "bg-primary-600 text-white"
                : "bg-surface-100 text-surface-600 hover:bg-surface-200"
            }`}
          >
            Semua ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("UNREAD")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === "UNREAD"
                ? "bg-primary-600 text-white"
                : "bg-surface-100 text-surface-600 hover:bg-surface-200"
            }`}
          >
            Belum Dibaca ({unreadCount})
          </button>
          <button
            onClick={() => setFilter("URGENT")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === "URGENT"
                ? "bg-primary-600 text-white"
                : "bg-surface-100 text-surface-600 hover:bg-surface-200"
            }`}
          >
            Penting / Peringatan
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerReminders}
            disabled={cycling}
            className="flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-semibold text-surface-700 transition hover:bg-surface-50 disabled:opacity-50"
            title="Periksa task jatuh tempo dan jadwal kalender sekarang"
          >
            <Icon name="bolt" size={14} className={cycling ? "animate-spin text-primary-600" : "text-surface-500"} />
            {cycling ? "Memeriksa..." : "Periksa Pengingat"}
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 rounded-lg bg-surface-100 px-3 py-1.5 text-xs font-semibold text-surface-700 transition hover:bg-surface-200"
            >
              <Icon name="check" size={14} />
              Tandai Semua Dibaca
            </button>
          )}
        </div>
      </div>

      {/* Notifications list */}
      {loading ? (
        <div className="py-12 text-center text-xs text-surface-400">Memuat notifikasi...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-200 bg-surface-50/50 py-16 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-100 text-surface-400">
            <Icon name="bell" size={24} />
          </div>
          <p className="text-sm font-semibold text-surface-700">Tidak ada notifikasi</p>
          <p className="mt-1 text-xs text-surface-400">
            {filter === "UNREAD"
              ? "Semua notifikasi telah dibaca. Anda sudah tertata rapi!"
              : "Belum ada pengingat atau peringatan aktif saat ini."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`group flex items-start justify-between gap-4 rounded-xl border p-4 transition-all ${
                item.isRead
                  ? "border-surface-200/60 bg-white opacity-85 hover:opacity-100"
                  : "border-primary-200/80 bg-gradient-to-r from-primary-50/40 to-white shadow-xs"
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    item.severity === "URGENT"
                      ? "bg-danger-100 text-danger-600"
                      : item.severity === "WARNING"
                      ? "bg-warning-100 text-warning-600"
                      : "bg-primary-100 text-primary-600"
                  }`}
                >
                  <Icon name={getTypeIcon(item.type)} size={18} />
                </span>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`text-sm font-semibold ${item.isRead ? "text-surface-700" : "text-surface-900"}`}>
                      {item.title}
                    </h3>
                    {getSeverityBadge(item.severity)}
                    {!item.isRead && (
                      <span className="h-2 w-2 rounded-full bg-primary-600 animate-pulse" />
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-surface-600">{item.message}</p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-surface-400">
                    <span>{new Date(item.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</span>
                    {item.linkUrl && (
                      <Link
                        href={item.linkUrl}
                        className="font-semibold text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
                      >
                        Buka Sumber <Icon name="arrowRight" size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                {!item.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(item.id)}
                    title="Tandai telah dibaca"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition"
                  >
                    <Icon name="check" size={15} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  title="Hapus notifikasi"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:bg-danger-50 hover:text-danger-600 transition"
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
