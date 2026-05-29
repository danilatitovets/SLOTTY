import type { ExtendedMasterProfile, NearestSlotInfo } from './types';
import { MasterPublicHeroSection } from './MasterPublicHeroSection';

type Props = {
  master: ExtendedMasterProfile;
  userLat: number | null;
  userLng: number | null;
  nearest?: NearestSlotInfo | null;
  nearestLoading?: boolean;
};

export function MasterProfileDesktopHero(props: Props) {
  return <MasterPublicHeroSection {...props} layout="desktop" className="mb-4" />;
}
