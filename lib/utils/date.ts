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

const DAY_MS = 24 * 60 * 60 * 1000;

/** Compact timestamp for inbox rows (time today, "Hier", weekday, then date). */
export function formatConversationTimestamp(value: string): string {
  try {
    const date = new Date(value);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return formatFr(date, TIME_SHORT);
    }
    const yesterday = new Date(now.getTime() - DAY_MS);
    if (date.toDateString() === yesterday.toDateString()) return "Hier";
    if (now.getTime() - date.getTime() < 7 * DAY_MS) {
      return new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(date);
    }
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    }).format(date);
  } catch {
    return "";
  }
}

/** Time-only label shown under each chat bubble. */
export function formatMessageTime(value: string): string {
  try {
    return formatFr(new Date(value), TIME_SHORT);
  } catch {
    return "";
  }
}

/** Human day separator inserted between message groups. */
export function formatMessageDaySeparator(value: string): string {
  try {
    const date = new Date(value);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return "Aujourd'hui";
    const yesterday = new Date(now.getTime() - DAY_MS);
    if (date.toDateString() === yesterday.toDateString()) return "Hier";
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(date);
  } catch {
    return "";
  }
}
