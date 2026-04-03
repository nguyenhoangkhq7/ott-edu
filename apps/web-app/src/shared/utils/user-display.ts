export function getDisplayName(firstName?: string | null, lastName?: string | null, email?: string | null): string {
  const fullName = [firstName, lastName].filter((part): part is string => Boolean(part && part.trim())).join(" ").trim();
  if (fullName.length > 0) {
    return fullName;
  }

  return email?.trim() || "User";
}

export function getInitialsFromDisplayName(displayName: string): string {
  const normalized = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (normalized.length === 0) {
    return "U";
  }

  if (normalized.length === 1) {
    return normalized[0][0].toUpperCase();
  }

  const firstInitial = normalized[0][0] ?? "";
  const lastInitial = normalized[normalized.length - 1][0] ?? "";

  return `${firstInitial}${lastInitial}`.toUpperCase();
}
