const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

function cleanupExpired() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) store.delete(key);
  }
}

/**
 * Generic in-memory rate limiter keyed by an arbitrary string.
 * Returns true if the attempt should be allowed, false if rate-limited.
 */
export function checkRateLimit(
  key: string,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  windowMs = DEFAULT_WINDOW_MS,
): boolean {
  cleanupExpired();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxAttempts) {
    return false;
  }

  entry.count += 1;
  return true;
}

/**
 * Reset rate limit for a specific key (e.g. after successful login).
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}
