import { createTransport, type Transporter } from "nodemailer";

let transporter: Transporter | null = null;

function isLocalInbucket(host: string, port: number): boolean {
  return (host === "127.0.0.1" || host === "localhost") && port === 54325;
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? "notifications@vielocale.fr";

  if (!host) {
    return null;
  }

  if (isLocalInbucket(host, port)) {
    return { host, port, user: null, pass: null, from };
  }

  if (!user || !pass) {
    return null;
  }

  return { host, port, user, pass, from };
}

export function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  const config = getSmtpConfig();
  if (!config) {
    console.warn("[email] SMTP not configured (missing SMTP_HOST/USER/PASS)");
    return null;
  }

  transporter = createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    ...(config.user && config.pass
      ? { auth: { user: config.user, pass: config.pass } }
      : {}),
  });

  return transporter;
}

export function getFromAddress(): string {
  return process.env.SMTP_FROM ?? "notifications@vielocale.fr";
}
