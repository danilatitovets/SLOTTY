/** Якоря секций профиля для mini-nav и scroll. */
export const MASTER_PROFILE_SECTION_IDS = {
  services: 'master-profile-services',
  portfolio: 'master-profile-portfolio',
  reviews: 'master-profile-reviews',
  about: 'master-profile-about',
  address: 'master-profile-address',
  rules: 'master-profile-rules',
} as const;

export type MasterProfileSectionId =
  (typeof MASTER_PROFILE_SECTION_IDS)[keyof typeof MASTER_PROFILE_SECTION_IDS];

export const MASTER_PROFILE_NAV_ITEMS: Array<{ id: MasterProfileSectionId; label: string }> = [
  { id: MASTER_PROFILE_SECTION_IDS.services, label: 'Услуги' },
  { id: MASTER_PROFILE_SECTION_IDS.portfolio, label: 'Работы' },
  { id: MASTER_PROFILE_SECTION_IDS.reviews, label: 'Отзывы' },
  { id: MASTER_PROFILE_SECTION_IDS.about, label: 'О мастере' },
  { id: MASTER_PROFILE_SECTION_IDS.address, label: 'Адрес' },
  { id: MASTER_PROFILE_SECTION_IDS.rules, label: 'Правила' },
];

export function scrollToMasterProfileSection(id: MasterProfileSectionId): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
