import { createHmac } from "crypto";

const ALGORITHM = "sha256";
const TOKEN_VERSION = "v1";
const TOKEN_EXPIRY_SECONDS = 365 * 24 * 60 * 60; // 1 year

function getSecret(): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for unsubscribe token");
  return secret;
}

export function generateUnsubscribeToken(userId: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS;
  const payload = `${TOKEN_VERSION}:${userId}:${expiresAt}`;
  const signature = createHmac(ALGORITHM, getSecret())
    .update(payload)
    .digest("base64url");
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function verifyUnsubscribeToken(token: string): { userId: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 4) return null;

    const [version, userId, expiresAtStr, signature] = parts;
    if (version !== TOKEN_VERSION) return null;

    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() / 1000 > expiresAt) return null;

    const payload = `${version}:${userId}:${expiresAtStr}`;
    const expectedSignature = createHmac(ALGORITHM, getSecret())
      .update(payload)
      .digest("base64url");

    if (signature !== expectedSignature) return null;
    return { userId };
  } catch {
    return null;
  }
}
