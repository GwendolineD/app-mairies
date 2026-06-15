const DATE_TIME_SHORT: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

const DATE_FULL: Intl.DateTimeFormatOptions = {
  dateStyle: "full",
  timeStyle: "short",
};

const TIME_SHORT: Intl.DateTimeFormatOptions = {
  timeStyle: "short",
};

function formatFr(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("fr-FR", options).format(date);
}

export function formatEventRange(start: string, end: string): string {
  try {
    return `${formatFr(new Date(start), DATE_TIME_SHORT)} → ${formatFr(new Date(end), DATE_TIME_SHORT)}`;
  } catch {
    return "Planning à confirmer";
  }
}

export function formatEventDetail(start: string, end: string): string {
  try {
    return `${formatFr(new Date(start), DATE_FULL)} — ${formatFr(new Date(end), TIME_SHORT)}`;
  } catch {
    return "Planning à confirmer";
  }
}

export function formatShortDate(iso: string): string {
  try {
    return formatFr(new Date(iso), { dateStyle: "medium" });
  } catch {
    return "";
  }
}

export function formatRelativeTime(iso: string): string {
  try {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "à l'instant";
    if (diffMin < 60) return `il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `il y a ${diffH} h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `il y a ${diffD} j`;
    return formatFr(date, { dateStyle: "medium" });
  } catch {
    return "";
  }
}

export function formatRelativeTimeAccueil(iso: string): string {
  const relative = formatRelativeTime(iso);
  if (!relative) return relative;
  return relative.charAt(0).toUpperCase() + relative.slice(1);
}

export function formatEventAccueilDate(iso: string): { day: number; month: string } {
  const date = new Date(iso);
  const month = new Intl.DateTimeFormat("fr-FR", { month: "short" })
    .format(date)
    .replace(".", "")
    .toUpperCase();
  return { day: date.getDate(), month };
}

export function formatMemberSince(iso: string): string {
  try {
    const date = new Date(iso);
    const month = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(date);
    return `Membre depuis ${month} ${date.getFullYear()}`;
  } catch {
    return "Membre";
  }
}

export function formatEventAccueilSchedule(iso: string): string {
  try {
    const date = new Date(iso);
    const weekday = new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(date);
    const dayMonth = new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
    }).format(date);
    const time = new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" }).format(date);
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${capitalizedWeekday} ${dayMonth} à ${time}`;
  } catch {
    return "Date à confirmer";
  }
}
