import { logger } from "@/lib/logger";

export interface TelegramNotificationPayload {
  title: string;
  message: string;
  severity?: "INFO" | "WARNING" | "CRITICAL";
  linkUrl?: string;
  chatId?: string;
}

export interface TelegramSendResult {
  success: boolean;
  messageId?: number;
  reason?: string;
}

const SEVERITY_EMOJIS: Record<string, string> = {
  INFO: "ℹ️",
  WARNING: "⚠️",
  CRITICAL: "🚨",
};

/**
 * Kirim pesan notifikasi melalui Telegram Bot API.
 * Menggunakan standard fetch bawaan Node 18+ tanpa dependensi luar.
 * Tidak pernah melempar error (fail-safe) agar tidak memblokir workflow aplikasi.
 */
export async function sendTelegramNotification(
  payload: TelegramNotificationPayload
): Promise<TelegramSendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const targetChatId = (payload.chatId || process.env.TELEGRAM_CHAT_ID)?.trim();

  if (!token || !targetChatId) {
    logger.debug("Telegram notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured");
    return {
      success: false,
      reason: "TELEGRAM_NOT_CONFIGURED",
    };
  }

  const emoji = SEVERITY_EMOJIS[payload.severity || "INFO"] || "🔔";
  
  // Format HTML aman untuk Telegram
  const escapeHtml = (str: string) =>
    str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  let text = `<b>${emoji} ${escapeHtml(payload.title)}</b>\n\n${escapeHtml(payload.message)}`;
  if (payload.linkUrl) {
    text += `\n\n🔗 <i>${escapeHtml(payload.linkUrl)}</i>`;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: targetChatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    });

    const body = (await res.json()) as { ok: boolean; result?: { message_id: number }; description?: string };

    if (!res.ok || !body.ok) {
      const reason = body.description || `HTTP ${res.status}`;
      logger.warn("Failed to send Telegram notification", { reason });
      return { success: false, reason };
    }

    return {
      success: true,
      messageId: body.result?.message_id,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown fetch error";
    logger.warn("Exception while sending Telegram notification", { error: reason });
    return {
      success: false,
      reason,
    };
  }
}

/**
 * Uji koneksi bot Telegram dengan mengirimkan pesan tes.
 */
export async function testTelegramConnection(chatId?: string): Promise<TelegramSendResult> {
  return sendTelegramNotification({
    title: "Personal Progress OS — Test Notification",
    message: "Halo! Bot Telegram berhasil terhubung dengan sistem Personal Progress OS Anda. Notifikasi pengingat & update penting akan dikirim melalui chat ini.",
    severity: "INFO",
    chatId,
  });
}
