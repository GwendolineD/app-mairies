/**
 * Labels for event attendance figures. The app shows a single public number
 * everywhere: the headcount (registrations + companions), never the raw row
 * count, so people are not confused by two different figures.
 */

function peopleWord(count: number): string {
  return count === 1 ? "personne" : "personnes";
}

/** "12 personnes attendues" / "1 personne attendue" */
export function formatHeadcountLabel(count: number): string {
  return `${count} ${peopleWord(count)} ${count === 1 ? "attendue" : "attendues"}`;
}

/** Compact variant for cards: "12 personnes" / "1 personne" */
export function formatHeadcountShort(count: number): string {
  return `${count} ${peopleWord(count)}`;
}

/** Summary of the member's own registration: "Vous venez seul·e" / "Vous serez 3" */
export function formatOwnPartyLabel(guestsCount: number): string {
  if (guestsCount <= 0) return "Vous venez seul·e";
  return `Vous serez ${guestsCount + 1}`;
}

/** Suffix for buttons once registered: "3 personnes" (party size incl. the member) */
export function formatPartySizeLabel(guestsCount: number): string {
  return formatHeadcountShort(guestsCount + 1);
}

/** Accessible label of the "+N" chip next to a name: "2 accompagnants" */
export function formatGuestsLabel(guestsCount: number): string {
  return `${guestsCount} accompagnant${guestsCount === 1 ? "" : "s"}`;
}
