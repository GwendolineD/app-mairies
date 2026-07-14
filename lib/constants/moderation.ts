export const SUSPENSION_REASON_MIN = 10;
export const SUSPENSION_REASON_MAX = 500;

export function validateSuspensionReason(reason: string): string | null {
  const trimmed = reason.trim();
  if (!trimmed) {
    return "Merci d'indiquer une raison de suspension.";
  }
  if (trimmed.length < SUSPENSION_REASON_MIN) {
    return `La raison doit contenir au moins ${SUSPENSION_REASON_MIN} caractères.`;
  }
  if (trimmed.length > SUSPENSION_REASON_MAX) {
    return `La raison ne peut pas dépasser ${SUSPENSION_REASON_MAX} caractères.`;
  }
  return null;
}
