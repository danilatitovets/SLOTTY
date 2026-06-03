/** Как показывать клиента мастеру в уведомлениях (не «чат» из Google). */

export type ClientProfileNotifyFields = {
  full_name: string;
  phone: string | null;
  telegram_username: string | null;
};

function looksLikeRealSingleName(word: string): boolean {
  return /^[А-Яа-яЁё][А-Яа-яЁё-]{2,}$/.test(word.trim());
}

export function resolveClientNotifyLabel(row: ClientProfileNotifyFields): string {
  const name = row.full_name?.trim() || '';
  const parts = name.split(/\s+/).filter(Boolean);
  const phone = row.phone?.trim() || null;
  const username = row.telegram_username?.trim().replace(/^@+/, '') || null;

  if (parts.length >= 2) return name;

  if (phone) {
    if (parts.length === 1 && looksLikeRealSingleName(parts[0]!)) {
      return `${name} · ${phone}`;
    }
    return phone;
  }

  if (username) {
    const handle = `@${username}`;
    if (parts.length === 1 && name.length >= 3 && looksLikeRealSingleName(parts[0]!)) {
      return `${name} (${handle})`;
    }
    return handle;
  }

  if (parts.length === 1 && name.length >= 2) return name;
  return 'Клиент';
}
