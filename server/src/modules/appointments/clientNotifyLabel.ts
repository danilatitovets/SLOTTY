import { formatClientName, type ClientNameFields } from '../../lib/displayFormat.js';

/** @deprecated Используйте ClientNameFields из displayFormat */
export type ClientProfileNotifyFields = ClientNameFields;

export function resolveClientNotifyLabel(row: ClientProfileNotifyFields): string {
  return formatClientName(row);
}
