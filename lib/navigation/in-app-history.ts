const STACK_KEY = "vl:in-app-nav-stack";
const MAX_STACK = 30;

export function readInAppNavStack(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STACK_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeInAppNavStack(stack: string[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STACK_KEY, JSON.stringify(stack.slice(-MAX_STACK)));
}

/** Record a client-side pathname visit (pathname only, no query string). */
export function trackInAppPathname(pathname: string) {
  const stack = readInAppNavStack();
  if (stack[stack.length - 1] !== pathname) {
    stack.push(pathname);
    writeInAppNavStack(stack);
  }
}

/**
 * Resolve where "Retour" should navigate.
 * Uses our in-app stack because Next.js App Router can replace history entries
 * between sibling layout routes, making router.back() unreliable.
 */
export function resolveInAppBackTarget(
  currentPathname: string,
  fallbackHref: string,
): string {
  const stack = readInAppNavStack();
  const idx = stack.lastIndexOf(currentPathname);

  if (idx > 0) {
    const target = stack[idx - 1]!;
    writeInAppNavStack(stack.slice(0, idx));
    return target;
  }

  return fallbackHref;
}
