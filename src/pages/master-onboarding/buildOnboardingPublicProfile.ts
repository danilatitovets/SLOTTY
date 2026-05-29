import { isOnboardingAvatarPhotoUrl } from '../../features/profile/lib/profileDisplayAvatar';
import type { MasterContactRow } from '../../features/master-onboarding/model/masterContacts';
import type { MasterOnboardingService } from '../../features/profile/lib/demoMasterStorage';
import type { MasterLocation } from '../../features/profile/model/masterLocation';
import type { MasterCertificate } from '../../features/master-onboarding/model/masterCertificate';
import { sortEducationItemsChronologically, type OnboardingEducationItem } from './onboardingEducation';
import type { ExtendedMasterProfile } from '../client/masterProfile/types';

export type BuildOnboardingPublicProfileInput = {
  name: string;
  description: string;
  phone: string;
  clientContacts: MasterContactRow[];
  location: MasterLocation;
  services: MasterOnboardingService[];
  categoryName: string;
  categoryCode: string;
  photoUrl?: string | null;
  certificates?: MasterCertificate[];
  educationItems?: OnboardingEducationItem[];
};

export function buildOnboardingPublicProfile(
  input: BuildOnboardingPublicProfileInput,
): ExtendedMasterProfile {
  const name = input.name.trim() || 'Мастер';
  const photoRaw = input.photoUrl?.trim();
  const photoUrl = photoRaw && isOnboardingAvatarPhotoUrl(photoRaw) ? photoRaw : '';

  const contactRows = input.clientContacts
    .filter((row) => row.value.trim())
    .map((row) => ({ type: row.type, value: row.value.trim() }));

  const activeServices = input.services.filter((s) => s.isActive !== false);

  return {
    masterId: 'onboarding-preview',
    masterName: name,
    category: input.categoryName || 'Категория',
    categoryCode: input.categoryCode || undefined,
    rating: 0,
    reviewsCount: 0,
    location: input.location,
    photoUrl,
    bio: input.description.trim(),
    phone: input.phone.trim() ? input.phone.trim() : undefined,
    contacts: contactRows.length ? contactRows : undefined,
    services: activeServices.map((s) => ({
      id: s.id,
      title: s.title,
      duration: s.durationMin,
      price: s.priceByn,
      description: s.description?.trim() ?? '',
      priceType: s.priceType ?? 'fixed',
    })),
    availableSlotsByServiceId: Object.fromEntries(activeServices.map((s) => [s.id, []])),
    reviews: [],
    certificates: (input.certificates ?? []).map((c) => ({
      id: c.id,
      title: c.title,
      issuer: c.organization?.trim() || '',
      year: c.year,
      imageUrl: c.imageUrl,
      description: c.description,
    })),
    portfolio: [],
    careerItems: sortEducationItemsChronologically(input.educationItems ?? [])
      .filter((e) => e.title.trim().length >= 2)
      .map((e) => ({
        id: e.id,
        type: 'education' as const,
        title: e.title.trim(),
        place: e.place.trim(),
        startYear: e.startYear?.trim() || undefined,
        endYear: e.endYear?.trim() || undefined,
        description: e.description?.trim() || undefined,
      })),
  };
}
