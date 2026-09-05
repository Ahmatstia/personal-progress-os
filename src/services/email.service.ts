import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "@/lib/logger";

export interface EmailNotificationPayload {
  to?: string;
  subject: string;
  text?: string;
  html?: string;
  severity?: "INFO" | "WARNING" | "CRITICAL";
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  reason?: string;
}

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter;

  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.trim();
  const host = process.env.EMAIL_HOST?.trim() || "smtp.gmail.com";
  const port = parseInt(process.env.EMAIL_PORT?.trim() || "465", 10);
  const secure = process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === "true" : port === 465;

  if (!user || !pass) {
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  return cachedTransporter;
}

/**
 * Kirim email notifikasi melalui SMTP (misal Gmail App Password atau provider lain).
 * Bersifat fail-safe, tidak memutus alur program bila gagal/belum dikonfigurasi.
 */
export async function sendEmailNotification(
  payload: EmailNotificationPayload
): Promise<EmailSendResult> {
  const targetEmail = (payload.to || process.env.NOTIFICATION_EMAIL_TO || process.env.EMAIL_USER)?.trim();

  if (!targetEmail) {
    logger.debug("Email notification skipped: No recipient email provided or configured");
    return {
      success: false,
      reason: "RECIPIENT_NOT_CONFIGURED",
    };
  }

  const transporter = getTransporter();
  if (!transporter) {
    logger.debug("Email notification skipped: EMAIL_USER or EMAIL_PASS not configured");
    return {
      success: false,
      reason: "EMAIL_NOT_CONFIGURED",
    };
  }

  const fromAddress = process.env.EMAIL_FROM?.trim() || `"Personal Progress OS" <${process.env.EMAIL_USER}>`;

  // Template email HTML sederhana dan elegan
  const htmlContent =
    payload.html ||
    `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="color: #0f172a; margin: 0; font-size: 20px;">Personal Progress OS</h2>
      </div>
      <h3 style="color: #1e293b; font-size: 16px; margin-top: 0;">${payload.subject}</h3>
      <div style="color: #334155; font-size: 14px; line-height: 1.6; white-space: pre-line; margin: 16px 0;">
        ${payload.text || ""}
      </div>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
        Email ini dikirim secara otomatis oleh Personal Progress OS.
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: targetEmail,
      subject: payload.subject,
      text: payload.text || payload.subject,
      html: htmlContent,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Failed to send email";
    logger.warn("Exception while sending email notification", { error: reason });
    return {
      success: false,
      reason,
    };
  }
}

/**
 * Uji koneksi email SMTP dengan mengirimkan email percobaan.
 */
export async function testEmailConnection(to?: string): Promise<EmailSendResult> {
  return sendEmailNotification({
    to,
    subject: "Personal Progress OS — Uji Coba Pengiriman Email",
    text: "Halo! Konfigurasi SMTP Email Anda berhasil terhubung dengan sistem Personal Progress OS. Notifikasi penting dan pengingat dapat dikirimkan ke alamat ini.",
    severity: "INFO",
  });
}
