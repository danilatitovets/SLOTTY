export type DataExportJobStatus = 'pending' | 'processing' | 'ready' | 'failed' | 'expired';

export type DataExportJobDto = {
  id: string;
  userId: string;
  masterProfileId: string;
  status: DataExportJobStatus;
  format: 'zip';
  expiresAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DataExportCapabilitiesDto = {
  available: boolean;
};

export type DataExportAuditAction =
  | 'export_requested'
  | 'export_processing_started'
  | 'export_ready'
  | 'export_failed'
  | 'export_downloaded'
  | 'export_retried'
  | 'export_expired';

export type MasterExportAppointmentRow = {
  date: string;
  time: string;
  client: string;
  service: string;
  status: string;
  price: string;
  format: string;
  comment: string;
  createdAt: string;
};

export type MasterExportServiceRow = {
  title: string;
  category: string;
  price: string;
  durationMinutes: number;
  active: string;
};

export type MasterExportClientRow = {
  name: string;
  phone: string;
  email: string;
  telegram: string;
  bookingsCount: number;
  cancellations: number;
  noShows: number;
};

export type MasterExportPaymentRow = {
  date: string;
  amount: string;
  status: string;
  plan: string;
  paymentMethod: string;
  paymentId: string;
};

export type MasterExportSupportTicketRow = {
  ticketCode: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
};

export type MasterExportSettingsRow = {
  section: string;
  key: string;
  value: string;
};

export type MasterExportUploadFile = {
  relativePath: string;
  url: string;
};

export type MasterExportReportSummary = {
  masterName: string;
  exportDate: string;
  plan: string;
  profileSummary: string;
  servicesCount: number;
  appointmentsCount: number;
  clientsCount: number;
  paymentsCount: number;
  activeSettingsSummary: string;
  briefSummary: string;
};

export type MasterExportPayload = {
  masterId: string;
  report: MasterExportReportSummary;
  appointments: MasterExportAppointmentRow[];
  services: MasterExportServiceRow[];
  clients: MasterExportClientRow[];
  payments: MasterExportPaymentRow[];
  supportTickets: MasterExportSupportTicketRow[];
  settings: MasterExportSettingsRow[];
  uploads: MasterExportUploadFile[];
  /** Технический JSON-снимок без секретов. */
  technicalJson: Record<string, unknown>;
};
