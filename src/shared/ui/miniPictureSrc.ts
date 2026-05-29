/** `public/photos/minipicture/*.webp` — мини-иллюстрации SLOTTY (единый стиль). */
const BASE = '/photos/minipicture';

export const MINI_PICTURE = {
  trust: `${BASE}/trust.webp`,
  reviewsEmpty: `${BASE}/reviews-empty.webp`,
  clientsEmpty: `${BASE}/clients-empty.webp`,
  appointmentsEmpty: `${BASE}/appointments-empty.webp`,
  notificationsEmpty: `${BASE}/notifications-empty.webp`,
  scheduleEmpty: `${BASE}/schedule-empty.webp`,
  servicesEmpty: `${BASE}/services-empty.webp`,
  publishSuccess: `${BASE}/publish-success.webp`,
  billingPro: `${BASE}/billing-pro.webp`,
  searchEmpty: `${BASE}/search-empty.webp`,
} as const;

export type MiniPictureKey = keyof typeof MINI_PICTURE;
