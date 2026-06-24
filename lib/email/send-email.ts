import { getFromAddress, getTransporter } from "./transporter";

export type EmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export type SendEmailResult = {
  success: boolean;
  error?: string;
};

export async function sendEmail(payload: EmailPayload): Promise<SendEmailResult> {
  const transporter = getTransporter();

  if (!transporter) {
    console.error("[email] Cannot send email: SMTP not configured");
    return { success: false, error: "SMTP not configured" };
  }

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: Array.isArray(payload.to) ? payload.to.join(", ") : payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      ...(payload.replyTo ? { replyTo: payload.replyTo } : {}),
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[email] Failed to send:", message);
    return { success: false, error: message };
  }
}
