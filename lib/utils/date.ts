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
