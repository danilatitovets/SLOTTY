export type PlatformAdminOverview = {
  usersTotal: number;
  clientsTotal: number;
  mastersTotal: number;
  activeMastersTotal: number;
  pendingCategoryRequests: number;
  blockedUsers: number;
  bookingsToday: number;
  cancellationsLast7Days: number;
};

export type CategoryChangeRequestAdmin = {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  adminComment: string | null;
  createdAt: string;
  reviewedAt: string | null;
  masterId: string;
  masterName: string;
  profileUrl: string;
  currentCategory: { id: string; code: string; name: string } | null;
  requestedCategory: { id: string; code: string; name: string };
  activity: {
    servicesCount: number;
    activeWindowsCount: number;
    futureBookingsCount: number;
    reviewsCount: number;
  };
};

export type PlatformUserListItem = {
  id: string;
  fullName: string;
  role: string;
  accountStatus: string;
  phone: string | null;
  email: string | null;
  telegramUsername: string | null;
  createdAt: string;
  hasMasterProfile: boolean;
  appointmentsCount: number;
};

export type PlatformUserAuthIdentity = {
  provider: 'telegram' | 'google' | 'email';
  providerUserId: string;
  email: string | null;
  emailVerified: boolean;
  linkedAt: string;
};

export type PlatformUserEmailConflict = {
  id: string;
  fullName: string;
  role: string;
};

export type PlatformUserDetail = PlatformUserListItem & {
  blockedAt: string | null;
  blockedReason: string | null;
  accessRestrictedUntil: string | null;
  accessRestrictionReason: string | null;
  identities: PlatformUserAuthIdentity[];
  emailConflicts: PlatformUserEmailConflict[];
};

export type PlatformMasterListItem = {
  masterId: string;
  displayName: string;
  slug: string | null;
  profileUrl: string;
  categoryName: string | null;
  publicationStatus: string;
  isVerified: boolean;
  planCode: string;
  planName: string;
  servicesCount: number;
  slotsCount: number;
  appointmentsCount: number;
  reviewsCount: number;
  ratingAvg: number;
  createdAt: string;
  hasPendingCategoryRequest: boolean;
};

export type PlatformMasterPickerItem = {
  masterId: string;
  displayName: string;
  planCode: string;
};

export type PlatformMasterBillingEvent = {
  id: string;
  eventType: string;
  planCode: string | null;
  billingPeriod: string | null;
  amount: number | null;
  currency: string;
  status: string;
  source: string;
  errorMessage: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type PlatformMasterDetail = PlatformMasterListItem & {
  phone: string | null;
  email: string | null;
  telegramUsername: string | null;
  adminHiddenReason: string | null;
  adminPauseReason: string | null;
  masterPlan: string;
  proInterested: boolean;
  proStatus: string | null;
  proStartedAt: string | null;
  proExpiresAt: string | null;
  publishedAt: string | null;
  subscription: {
    id: string;
    status: string;
    billingPeriod: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    planCode: string;
    planName: string;
    priceMonth: number;
    priceYear: number;
    usage: { activeServices: number; monthlyAppointments: number };
  } | null;
  billingEvents: PlatformMasterBillingEvent[];
};

export type PlatformServiceListItem = {
  id: string;
  title: string;
  masterId: string;
  masterName: string;
  categoryName: string | null;
  priceAmount: number;
  durationMinutes: number;
  isActive: boolean;
  isAdminHidden: boolean;
  adminHiddenAt: string | null;
  adminHiddenReason: string | null;
  createdAt: string;
  appointmentsCount: number;
};

export type PlatformBookingListItem = {
  id: string;
  clientId: string;
  clientName: string;
  clientAccountStatus: string;
  masterId: string;
  masterName: string;
  serviceTitle: string;
  startsAt: string;
  endsAt: string;
  status: string;
  cancelledBy: 'client' | 'master' | null;
  priceSnapshot: number;
  createdAt: string;
  updatedAt: string;
  cancelReason: string | null;
  clientNote: string | null;
};

export type PlatformBookingDetail = PlatformBookingListItem & {
  clientEmail: string | null;
  clientPhone: string | null;
  clientTelegramUsername: string | null;
  clientStats: {
    totalBookings: number;
    cancellationsByClient: number;
    cancellationsByMaster: number;
    noShows: number;
    completed: number;
  };
  recentBookings: PlatformBookingListItem[];
};

export type PlatformClientBookingStats = {
  clientId: string;
  fullName: string;
  accountStatus: string;
  email: string | null;
  totalBookings: number;
  cancellationsByClient: number;
  cancellationsByMaster: number;
  noShows: number;
  completed: number;
  lastBookingAt: string | null;
  lastCancellationAt: string | null;
};

export type PlatformAuditLogItem = {
  id: string;
  adminUserId: string;
  adminName: string;
  action: string;
  entityType: string;
  entityId: string;
  targetUserId: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};
