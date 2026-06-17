import { randomInt } from "crypto";

const CONSONANTS = "BDFGHJKLMNPRSTVZ";
const VOWELS = "AEIOU";

/**
 * Generates a short, pronounceable trial access code in format VL-XXXXX.
 * The 5-char body alternates consonant-vowel-consonant-vowel-consonant,
 * producing codes like VL-KAMET, VL-BURON, VL-DAFIL.
 */
export function generateTrialCode(): string {
  const pick = (chars: string) => chars[randomInt(chars.length)];
  const body = [
    pick(CONSONANTS),
    pick(VOWELS),
    pick(CONSONANTS),
    pick(VOWELS),
    pick(CONSONANTS),
  ].join("");
  return `VL-${body}`;
}

/** Normalizes user input for comparison: uppercase, trim, collapse whitespace. */
export function normalizeTrialCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}
