import type { ExtendedMasterProfile, NearestSlotInfo } from './types';
import { MasterPublicHeroCover } from './MasterPublicHeroCover';
import { MasterPublicHeroSection } from './MasterPublicHeroSection';

type Props = {
  master: ExtendedMasterProfile;
  userLat: number | null;
  userLng: number | null;
  nearest?: NearestSlotInfo | null;
  nearestLoading?: boolean;
};

export function MasterProfileDesktopHero(props: Props) {
  return (
    <>
      <MasterPublicHeroCover master={props.master} layout="desktop" />
      <MasterPublicHeroSection {...props} layout="desktop" profileCardOnly className="mb-4" />
    </>
  );
}
