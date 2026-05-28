export function formatDisplayName(firstName: string, lastName: string): string {
  const initial = lastName.trim().charAt(0).toUpperCase();
  return `${firstName.trim()} ${initial}.`;
}
