export type CategoryChangePolicyReason =
  | 'draft_profile'
  | 'empty_published_profile'
  | 'active_profile';

export type CategoryRefDto = { id: string; code: string; name: string };

export type CategoryChangeRequestDto = {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  adminComment: string | null;
  createdAt: string;
  reviewedAt: string | null;
  currentCategory: CategoryRefDto | null;
  requestedCategory: CategoryRefDto;
};

export type MasterActivityStatsDto = {
  servicesCount: number;
  activeWindowsCount: number;
  futureBookingsCount: number;
  completedBookingsCount: number;
  reviewsCount: number;
};

export type CategoryChangePolicyDto = {
  canChangeDirectly: boolean;
  needsRequest: boolean;
  reason: CategoryChangePolicyReason;
  hasActiveRequest: boolean;
  activeRequest: CategoryChangeRequestDto | null;
  activity: MasterActivityStatsDto;
};

export function computeLocalCategoryChangePolicy(params: {
  publicationStatus: string | null;
  servicesCount: number;
  activeWindowsCount?: number;
  futureBookingsCount?: number;
  completedBookingsCount?: number;
  reviewsCount?: number;
  hasActiveRequest?: boolean;
}): CategoryChangePolicyDto {
  const activity: MasterActivityStatsDto = {
    servicesCount: params.servicesCount,
    activeWindowsCount: params.activeWindowsCount ?? 0,
    futureBookingsCount: params.futureBookingsCount ?? 0,
    completedBookingsCount: params.completedBookingsCount ?? 0,
    reviewsCount: params.reviewsCount ?? 0,
  };
  const active =
    activity.servicesCount > 0 ||
    activity.activeWindowsCount > 0 ||
    activity.futureBookingsCount > 0 ||
    activity.completedBookingsCount > 0 ||
    activity.reviewsCount > 0;
  const published = params.publicationStatus === 'published';

  let reason: CategoryChangePolicyReason;
  let canChangeDirectly: boolean;
  if (!published) {
    reason = 'draft_profile';
    canChangeDirectly = true;
  } else if (!active) {
    reason = 'empty_published_profile';
    canChangeDirectly = true;
  } else {
    reason = 'active_profile';
    canChangeDirectly = false;
  }

  return {
    canChangeDirectly,
    needsRequest: !canChangeDirectly,
    reason,
    hasActiveRequest: Boolean(params.hasActiveRequest),
    activeRequest: null,
    activity,
  };
}
