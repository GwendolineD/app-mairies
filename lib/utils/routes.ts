export function isActivePath(
  pathname: string,
  href: string,
  exact = false,
): boolean {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Pick the most specific nav href that matches (avoids /mairie matching /mairie/evenements). */
export function resolveActiveNavHref(
  pathname: string,
  hrefs: readonly string[],
): string | null {
  let best: string | null = null;

  for (const href of hrefs) {
    if (!isActivePath(pathname, href)) continue;
    if (!best || href.length > best.length) {
      best = href;
    }
  }

  return best;
}
