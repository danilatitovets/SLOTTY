/** Legacy: способы оплаты временно кодировались в `payment_note` (синхрон с server). */
const PAYMENT_METHODS_MARKER = '\n\n__SLOTTY_PAYMENT_METHODS_JSON__\n';
const PAYMENT_METHODS_MARKER_ALT = '__SLOTTY_PAYMENT_METHODS_JSON__';

export function decodePaymentNote(db: string | null | undefined): {
  paymentNote: string;
  paymentMethods: string[];
} {
  const raw = (db ?? '').trim();
  if (!raw) return { paymentNote: '', paymentMethods: [] };

  let idx = raw.indexOf(PAYMENT_METHODS_MARKER);
  let markerLen = PAYMENT_METHODS_MARKER.length;
  if (idx === -1) {
    idx = raw.indexOf(PAYMENT_METHODS_MARKER_ALT);
    markerLen = PAYMENT_METHODS_MARKER_ALT.length;
  }
  if (idx === -1) return { paymentNote: raw, paymentMethods: [] };

  const note = raw.slice(0, idx).trim();
  const jsonPart = raw.slice(idx + markerLen).trim();
  try {
    const parsed = JSON.parse(jsonPart) as unknown;
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
      return { paymentNote: note, paymentMethods: parsed as string[] };
    }
  } catch {
    /* ignore */
  }
  return { paymentNote: note || raw, paymentMethods: [] };
}

/** Убирает legacy-маркер из комментария к оплате перед сохранением. */
export function sanitizePaymentNoteForSave(note: string | null | undefined): string | null {
  const decoded = decodePaymentNote(note ?? '');
  const plain = decoded.paymentNote.trim();
  return plain || null;
}
