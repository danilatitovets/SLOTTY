const REDACT_KEYS = new Set([
  'secret',
  'secret_key',
  'public_key',
  'token',
  'credit_card',
  'verification_value',
  'number',
  'cvc',
  'cvv',
  'authorization',
]);

function redactValue(key: string, value: unknown): unknown {
  const k = key.toLowerCase();
  if (REDACT_KEYS.has(k) || k.includes('secret') || k.includes('password')) {
    return '[redacted]';
  }
  if (typeof value === 'string' && value.length > 120) {
    return `${value.slice(0, 40)}…[truncated]`;
  }
  return value;
}

export function sanitizePayloadForLog(payload: unknown, depth = 0): unknown {
  if (depth > 6) return '[max-depth]';
  if (payload === null || payload === undefined) return payload;
  if (Array.isArray(payload)) {
    return payload.slice(0, 20).map((item) => sanitizePayloadForLog(item, depth + 1));
  }
  if (typeof payload !== 'object') return payload;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (typeof value === 'object' && value !== null) {
      out[key] = sanitizePayloadForLog(value, depth + 1);
    } else {
      out[key] = redactValue(key, value);
    }
  }
  return out;
}
