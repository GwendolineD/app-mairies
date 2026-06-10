export function formatDisplayName(firstName: string, lastName: string): string {
  const initial = lastName.trim().charAt(0).toUpperCase();
  return `${firstName.trim()} ${initial}.`;
}

export function resolveFirstName(profile: {
  first_name?: string | null;
  display_name?: string | null;
}): string {
  if (profile.first_name?.trim()) return profile.first_name.trim();
  const fromDisplay = profile.display_name?.trim().split(/\s+/)[0];
  return fromDisplay ?? "là";
}
