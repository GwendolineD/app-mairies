import { fr } from "date-fns/locale";
import { tz } from "@date-fns/tz";

/** Application timezone — all civil dates and display use Europe/Paris. */
export const APP_TIMEZONE = "Europe/Paris";

export const APP_LOCALE = fr;

/** Reusable Paris timezone context for date-fns `in` option. */
export const parisTz = tz(APP_TIMEZONE);

export const DAY_MS = 24 * 60 * 60 * 1000;
