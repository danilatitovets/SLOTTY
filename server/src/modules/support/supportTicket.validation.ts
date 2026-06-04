import { z } from 'zod';
import {
  SUPPORT_AFFECTED_SERVICES,
  SUPPORT_CATEGORIES,
  SUPPORT_CONTACT_CHANNELS,
  SUPPORT_SEVERITIES,
  SUPPORT_STATUSES,
} from './supportTicket.types.js';

export const createSupportTicketBodySchema = z.object({
  category: z.enum(SUPPORT_CATEGORIES),
  severity: z.enum(SUPPORT_SEVERITIES),
  subject: z.string().trim().min(3).max(200),
  affectedServices: z
    .array(z.enum(SUPPORT_AFFECTED_SERVICES))
    .min(1)
    .max(SUPPORT_AFFECTED_SERVICES.length),
  relatedBookingCode: z.string().trim().max(64).optional().nullable(),
  relatedPaymentId: z.string().trim().max(128).optional().nullable(),
  message: z.string().trim().min(10).max(5000),
  preferredContactChannel: z.enum(SUPPORT_CONTACT_CHANNELS),
  contactEmail: z.string().trim().email().max(320).optional().nullable(),
  consentAccepted: z.literal(true, {
    errorMap: () => ({ message: 'Необходимо согласие на обработку данных обращения' }),
  }),
  clientMetadata: z.record(z.unknown()).optional(),
});

export const replySupportTicketBodySchema = z.object({
  message: z.string().trim().min(1).max(5000),
});

export const adminStatusBodySchema = z.object({
  status: z.enum(SUPPORT_STATUSES),
});

export const adminAssignBodySchema = z.object({
  assignedTo: z.string().uuid().nullable(),
});

export function normalizeBookingCode(raw: string | null | undefined): string | null {
  const v = raw?.trim();
  if (!v) return null;
  if (!/^SL-[A-Z0-9-]+$/i.test(v)) return null;
  return v.toUpperCase();
}
