const PREFIX = "vl:draft:";

export function readFormDraft<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}`);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeFormDraft<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export function clearFormDraft(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${PREFIX}${key}`);
}
