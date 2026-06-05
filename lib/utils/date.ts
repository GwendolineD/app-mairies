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

const WEEKDAY_DATE: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** "Samedi 15 juin 2025" */
export function formatLongDateFr(value: string): string | null {
  try {
    return capitalize(formatFr(new Date(value), WEEKDAY_DATE));
  } catch {
    return null;
  }
}

/** "9h00" */
export function formatTimeFr(value: string): string | null {
  try {
    const date = new Date(value);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}h${minutes}`;
  } catch {
    return null;
  }
}

/** Short, human temporality label for an initiative card. */
export function formatInitiativeWhen(
  dateMode: string,
  startsAt: string | null,
): string {
  if (dateMode === "once" && startsAt) {
    return formatLongDateFr(startsAt) ?? "Date à confirmer";
  }
  if (dateMode === "recurring") return "Rendez-vous récurrent";
  return "À tout moment";
}
