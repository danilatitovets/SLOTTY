export const SUPPORT_CATEGORIES = [
  'account_login',
  'master_profile',
  'services',
  'schedule',
  'appointments',
  'booking_no_show',
  'notifications',
  'billing_plan',
  'payment_bepaid',
  'integrations',
  'map_address',
  'ui_bug',
  'other',
] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export const SUPPORT_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
export type SupportSeverity = (typeof SUPPORT_SEVERITIES)[number];

export const SUPPORT_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'WAITING_USER',
  'RESOLVED',
  'CLOSED',
] as const;
export type SupportTicketStatus = (typeof SUPPORT_STATUSES)[number];

export const SUPPORT_CONTACT_CHANNELS = ['email', 'telegram', 'in_app'] as const;
export type SupportContactChannel = (typeof SUPPORT_CONTACT_CHANNELS)[number];

export const SUPPORT_AFFECTED_SERVICES = [
  'web_cabinet',
  'telegram_bot',
  'email_notifications',
  'payments',
  'map_address',
  'catalog',
  'appointments',
  'pro_subscription',
  'unknown',
] as const;
export type SupportAffectedService = (typeof SUPPORT_AFFECTED_SERVICES)[number];

export type SupportSystemStatus = 'operational' | 'degraded' | 'partial_outage' | 'maintenance';

export type SupportTicketDto = {
  id: string;
  ticketCode: string;
  userId: string;
  masterProfileId: string | null;
  plan: string | null;
  category: SupportCategory;
  severity: SupportSeverity;
  subject: string;
  affectedServices: SupportAffectedService[];
  relatedBookingCode: string | null;
  relatedPaymentId: string | null;
  message: string;
  preferredContactChannel: SupportContactChannel;
  contactEmail: string | null;
  contactTelegram: string | null;
  status: SupportTicketStatus;
  source: string;
  assignedTo: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type SupportTicketEventDto = {
  id: string;
  eventType: string;
  actorUserId: string | null;
  actorRole: string;
  message: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type SupportTicketAttachmentDto = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type CreateSupportTicketInput = {
  category: SupportCategory;
  severity: SupportSeverity;
  subject: string;
  affectedServices: SupportAffectedService[];
  relatedBookingCode?: string | null;
  relatedPaymentId?: string | null;
  message: string;
  preferredContactChannel: SupportContactChannel;
  contactEmail?: string | null;
  consentAccepted: boolean;
  clientMetadata?: Record<string, unknown>;
};

export type SupportTicketDetailDto = SupportTicketDto & {
  events: SupportTicketEventDto[];
  attachments: SupportTicketAttachmentDto[];
};
