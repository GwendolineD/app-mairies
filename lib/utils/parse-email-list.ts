import { z } from "zod";

const emailSchema = z.string().email();

export function parseEmailList(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function getValidEmails(raw: string): string[] {
  return parseEmailList(raw).filter(
    (email) => emailSchema.safeParse(email).success,
  );
}

export function hasAtLeastOneValidEmail(raw: string): boolean {
  return getValidEmails(raw).length >= 1;
}
