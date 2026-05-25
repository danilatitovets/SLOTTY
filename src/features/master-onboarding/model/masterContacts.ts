export type ContactType = 'telegram' | 'viber' | 'vk' | 'instagram' | 'whatsapp' | 'other';

export type MasterContact = {
  type: ContactType;
  value: string;
};

/** Строка в форме с локальным id для React keys */
export type MasterContactRow = MasterContact & { id: string };

export type MasterProfileStep3Payload = {
  displayName: string;
  description: string;
  phone: string;
  contacts: MasterContact[];
};

const TG_USER = /^@?[a-zA-Z0-9_]{5,32}$/;
const TG_URL = /^(https?:\/\/)?(t\.me|telegram\.me)\/[\w+/]+/i;

const IG_USER = /^@?[a-zA-Z0-9._]{1,30}$/;
const IG_URL = /^(https?:\/\/)?(www\.)?instagram\.com\//i;

const VK_URL = /^(https?:\/\/)?(www\.)?(m\.)?vk\.com\//i;
const VK_SHORT = /^@?[a-zA-Z0-9._-]{2,}$/;

const WA_URL = /^(https?:\/\/)?(www\.)?wa\.me\//i;
const VIBER_URL = /^viber:\/\//i;

function hasAnyDigit(s: string): boolean {
  return /\d/.test(s);
}

/** null = ок; строка = текст ошибки. */
export function validateContactValue(type: ContactType, raw: string): string | null {
  const v = raw.trim();
  if (!v) return 'Заполните контакт';

  switch (type) {
    case 'telegram':
      if (TG_URL.test(v) || TG_USER.test(v.replace(/^https?:\/\//i, ''))) return null;
      return 'Проверьте формат контакта';
    case 'instagram':
      if (IG_URL.test(v) || IG_USER.test(v)) return null;
      return 'Проверьте формат контакта';
    case 'vk':
      if (VK_URL.test(v) || VK_SHORT.test(v)) return null;
      return 'Проверьте формат контакта';
    case 'whatsapp':
      if (WA_URL.test(v) || hasAnyDigit(v)) return null;
      return 'Проверьте формат контакта';
    case 'viber': {
      if (VIBER_URL.test(v)) return null;
      const noScheme = v.replace(/^https?:\/\//i, '');
      if (TG_URL.test(v) || TG_URL.test(noScheme)) return 'Проверьте формат контакта';
      const tgCandidate = v.trim().replace(/^@/, '@');
      if (TG_USER.test(tgCandidate) || TG_USER.test(v.trim())) return 'Проверьте формат контакта';
      if (v.trim().startsWith('@') && !hasAnyDigit(v)) return 'Проверьте формат контакта';
      if (hasAnyDigit(v)) return null;
      return 'Проверьте формат контакта';
    }
    case 'other':
      if (v.length > 200) return 'Проверьте формат контакта';
      return null;
    default:
      return 'Проверьте формат контакта';
  }
}

const PREFIX: Record<ContactType, string> = {
  telegram: 'Telegram',
  viber: 'Viber',
  vk: 'VK',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  other: 'Контакт',
};

const LEGACY_PREFIX_TO_TYPE: Record<string, ContactType> = {
  telegram: 'telegram',
  viber: 'viber',
  vk: 'vk',
  instagram: 'instagram',
  whatsapp: 'whatsapp',
  контакт: 'other',
};

/** Разбор legacy-строки `Telegram: @x · Viber: …` в список контактов. */
export function parseLegacyContactLine(line: string): MasterContact[] {
  const t = line.trim();
  if (!t) return [];

  const chunks = t.split(/\s*·\s*/).map((p) => p.trim()).filter(Boolean);
  const out: MasterContact[] = [];

  for (const chunk of chunks) {
    const m = chunk.match(/^(Telegram|Viber|VK|Instagram|WhatsApp|Контакт):\s*(.+)$/i);
    if (m) {
      const type = LEGACY_PREFIX_TO_TYPE[m[1].toLowerCase()] ?? 'other';
      const value = m[2].trim();
      if (value) out.push({ type, value });
      continue;
    }
    if (chunk) out.push({ type: 'other', value: chunk });
  }

  return out;
}

export function contactsToRows(contacts: MasterContact[]): MasterContactRow[] {
  return contacts.map((c) => ({
    ...c,
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `c-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  }));
}

export function parseContactsJson(raw: unknown): MasterContact[] | null {
  if (raw == null) return null;
  if (!Array.isArray(raw)) return null;
  const out: MasterContact[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const t = o.type;
    const v = o.value;
    if (
      t === 'telegram' ||
      t === 'viber' ||
      t === 'vk' ||
      t === 'instagram' ||
      t === 'whatsapp' ||
      t === 'other'
    ) {
      if (typeof v === 'string' && v.trim()) {
        out.push({ type: t, value: v.trim() });
      }
    }
  }
  return out.length ? out : null;
}

export function contactRowsFromDraft(draft: {
  contact: string;
  contacts?: MasterContact[] | null;
}): MasterContactRow[] {
  if (draft.contacts?.length) return contactsToRows(draft.contacts);
  const parsed = parseLegacyContactLine(draft.contact);
  if (parsed.length) return contactsToRows(parsed);
  const legacy = draft.contact.trim();
  if (legacy) return contactsToRows([{ type: 'telegram', value: legacy }]);
  return [];
}

export function contactsToLegacyContactLine(contacts: MasterContact[]): string | null {
  if (!contacts.length) return null;
  const parts = contacts
    .map((c) => {
      const val = c.value.trim();
      if (!val) return '';
      return `${PREFIX[c.type]}: ${val}`;
    })
    .filter(Boolean);
  if (!parts.length) return null;
  const line = parts.join(' · ');
  return line.length > 500 ? `${line.slice(0, 497)}…` : line;
}

export const CONTACT_CHANNEL_META: { type: ContactType; label: string; placeholder: string }[] = [
  { type: 'telegram', label: 'Telegram', placeholder: '@username или t.me/username' },
  { type: 'viber', label: 'Viber', placeholder: '+375 29 000-00-00' },
  { type: 'vk', label: 'VK', placeholder: 'vk.com/username' },
  { type: 'instagram', label: 'Instagram', placeholder: '@username или instagram.com/username' },
  { type: 'whatsapp', label: 'WhatsApp', placeholder: '+375 29 000-00-00' },
  { type: 'other', label: 'Ещё', placeholder: 'Ссылка или контакт' },
];

export function countContactsByType(rows: MasterContactRow[], type: ContactType): number {
  return rows.filter((r) => r.type === type).length;
}

export function canAddContactChannel(rows: MasterContactRow[], type: ContactType): boolean {
  if (type === 'other') return countContactsByType(rows, 'other') < 5;
  return countContactsByType(rows, type) < 1;
}

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}

/** Ссылка для открытия контакта клиентом (профиль, кабинет). */
export function contactExternalHref(type: ContactType, raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v) || /^viber:\/\//i.test(v)) return v;

  switch (type) {
    case 'telegram': {
      const url = v.match(/(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([^\s?#]+)/i);
      if (url) return `https://t.me/${url[1].replace(/^\//, '')}`;
      const user = v.replace(/^@/, '').trim();
      if (TG_USER.test(user) || TG_USER.test(`@${user}`)) return `https://t.me/${user}`;
      return null;
    }
    case 'instagram': {
      const url = v.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([^\s?#/]+)/i);
      if (url) return `https://www.instagram.com/${url[1]}`;
      const user = v.replace(/^@/, '').trim();
      if (IG_USER.test(user) || IG_USER.test(`@${user}`)) return `https://www.instagram.com/${user}`;
      return null;
    }
    case 'vk': {
      const url = v.match(/(?:https?:\/\/)?(?:www\.)?(?:m\.)?vk\.com\/([^\s?#/]+)/i);
      if (url) return `https://vk.com/${url[1]}`;
      const id = v.replace(/^@/, '').trim();
      if (VK_SHORT.test(id)) return `https://vk.com/${id}`;
      return null;
    }
    case 'whatsapp': {
      const url = v.match(/(?:https?:\/\/)?(?:www\.)?wa\.me\/(\d+)/i);
      if (url) return `https://wa.me/${url[1]}`;
      const d = digitsOnly(v);
      if (d.length >= 10) return `https://wa.me/${d}`;
      return null;
    }
    case 'viber': {
      const d = digitsOnly(v);
      if (d.length >= 10) return `viber://chat?number=%2B${d}`;
      return null;
    }
    case 'other':
      return /^https?:\/\//i.test(v) ? v : null;
    default:
      return null;
  }
}

export function resolveFilledContacts(source: {
  contact?: string | null;
  contacts?: MasterContact[] | null;
}): MasterContact[] {
  if (source.contacts?.length) {
    return source.contacts.filter((c) => c.value.trim());
  }
  const parsed = parseLegacyContactLine(source.contact?.trim() ?? '');
  if (parsed.length) return parsed.filter((c) => c.value.trim());
  const legacy = source.contact?.trim();
  if (legacy) return [{ type: 'telegram', value: legacy }];
  return [];
}
