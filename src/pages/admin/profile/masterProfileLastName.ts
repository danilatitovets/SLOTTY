/** Фамилия из полного имени мастера (последнее слово). */
export function extractMasterLastName(fullName: string | null | undefined): string {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  return parts.length > 1 ? parts[parts.length - 1]! : parts[0]!;
}

export function lastNameMatchesInput(expected: string, input: string): boolean {
  const a = expected.trim().toLowerCase();
  const b = input.trim().toLowerCase();
  return a.length > 0 && a === b;
}
