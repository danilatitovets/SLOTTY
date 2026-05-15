/** Нормализация и проверка номера РБ (клиент). */

const BY_MOBILE_PREFIX = new Set(['25', '29', '33', '44']);

function onlyDigits(s: string): string {
  return s.replace(/\D/g, '');
}

/** Возвращает строку вида `+375 29 123 45 67` или null, если не мобильный РБ. */
export function normalizeBelarusPhone(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  let d = onlyDigits(t);
  if (d.length === 12 && d.startsWith('375')) {
    // ok
  } else if (d.length === 11 && d.startsWith('80')) {
    d = `375${d.slice(2)}`;
  } else if (d.length === 9) {
    d = `375${d}`;
  } else {
    return null;
  }
  if (d.length !== 12 || !d.startsWith('375')) return null;
  const op = d.slice(3, 5);
  if (!BY_MOBILE_PREFIX.has(op)) return null;
  const rest = d.slice(5);
  if (rest.length !== 7) return null;
  return `+375 ${op} ${rest.slice(0, 3)} ${rest.slice(3, 5)} ${rest.slice(5)}`;
}

export function isOptionalBelarusPhoneValid(raw: string): boolean {
  if (!raw.trim()) return true;
  return normalizeBelarusPhone(raw) != null;
}

/** Пошаговое отображение 375 + до 9 цифр абонента (макс. 12 цифр всего). */
function formatByMobileDigitsPartial(d: string): string {
  if (!d) return '';
  if (d.length <= 3) return `+${d}`;
  if (!d.startsWith('375')) return `+${d.slice(0, 12)}`;

  const rest = d.slice(3);
  let out = '+375';
  if (rest.length === 0) return out;
  out += ' ';
  if (rest.length <= 2) return out + rest;
  const op = rest.slice(0, 2);
  const sub = rest.slice(2);
  out += op;
  if (sub.length === 0) return out;
  out += ' ';
  if (sub.length <= 3) return out + sub;
  out += sub.slice(0, 3);
  const sub2 = sub.slice(3);
  if (sub2.length === 0) return out;
  out += ' ';
  if (sub2.length <= 2) return out + sub2;
  out += sub2.slice(0, 2);
  const sub3 = sub2.slice(2);
  if (sub3.length === 0) return out;
  out += ' ';
  return out + sub3.slice(0, 2);
}

/**
 * Ограничивает ввод длиной и форматом мобильного РБ: только цифры, макс. 12 в виде 375 + оператор + 7 цифр.
 * Поддержка восьмёрки: 80… → 375…
 */
export function sanitizeBelarusPhoneInput(raw: string): string {
  let d = onlyDigits(raw);
  if (!d) return '';

  if (d.startsWith('80')) {
    d = (`375${d.slice(2)}`).slice(0, 12);
  } else if (d.startsWith('375')) {
    d = d.slice(0, 12);
  } else if (d.length <= 9) {
    d = (`375${d}`).slice(0, 12);
  } else {
    d = (`375${d.slice(0, 9)}`).slice(0, 12);
  }

  return formatByMobileDigitsPartial(d);
}
