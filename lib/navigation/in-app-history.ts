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

export function pathnameFromInAppHref(href: string): string {
  return href.split("?")[0] ?? href;
}

export function buildInAppHref(pathname: string, search?: string): string {
  const trimmed = search?.replace(/^\?/, "").trim();
  return trimmed ? `${pathname}?${trimmed}` : pathname;
}

/** Record a client-side visit (pathname + query string). */
export function trackInAppHref(href: string) {
  const stack = readInAppNavStack();
  const pathname = pathnameFromInAppHref(href);
  const last = stack[stack.length - 1];

  if (last === href) return;

  const lastPathname = last ? pathnameFromInAppHref(last) : null;
  if (lastPathname === pathname) {
    stack[stack.length - 1] = href;
  } else {
    stack.push(href);
  }

  writeInAppNavStack(stack);
}

/** @deprecated Use trackInAppHref — kept for callers passing pathname only. */
export function trackInAppPathname(pathname: string) {
  trackInAppHref(pathname);
}

/**
 * Resolve where "Retour" should navigate.
 * Uses our in-app stack because Next.js App Router can replace history entries
 * between sibling layout routes, making router.back() unreliable.
 */
export function resolveInAppBackTarget(
  currentHref: string,
  fallbackHref: string,
): string {
  const stack = readInAppNavStack();
  const currentPathname = pathnameFromInAppHref(currentHref);

  let idx = stack.lastIndexOf(currentHref);
  if (idx === -1) {
    for (let i = stack.length - 1; i >= 0; i -= 1) {
      if (pathnameFromInAppHref(stack[i]!) === currentPathname) {
        idx = i;
        break;
      }
    }
  }

  if (idx > 0) {
    const target = stack[idx - 1]!;
    writeInAppNavStack(stack.slice(0, idx));
    return target;
  }

  return fallbackHref;
}
