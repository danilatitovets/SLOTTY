import type { ReactNode } from 'react';
import { MasterCabinetCoverBanner } from '../../admin/profile/adminProfilePortrait';
import { MasterCardPortrait } from '../components/MasterCardPortrait';
import type { ExtendedMasterProfile } from './types';

type Props = {
  master: ExtendedMasterProfile;
  heightClass?: string;
  children?: ReactNode;
};

/** Фоновая обложка публичного профиля (как в кабинете мастера). */
export function MasterPublicCoverBanner({
  master,
  heightClass = 'h-[180px] sm:h-[220px] lg:h-[240px]',
  children,
}: Props) {
  return (
    <MasterCabinetCoverBanner
      name={master.masterName}
      dedicatedCoverUrl={master.coverUrl}
      photoUrl={master.photoUrl}
      heightClass={heightClass}
    >
      {children}
    </MasterCabinetCoverBanner>
  );
}

export function MasterPublicPortraitOverlap({
  master,
  className = 'h-[120px] w-[120px] lg:h-[132px] lg:w-[132px]',
  badge,
}: {
  master: ExtendedMasterProfile;
  className?: string;
  badge?: ReactNode;
}) {
  return (
    <MasterCardPortrait
      masterName={master.masterName}
      photoUrl={master.photoUrl}
      className={`relative shrink-0 ${className}`}
      imageClassName="h-full w-full rounded-[12px] object-cover ring-[3px] ring-white lg:ring-4"
      loading="eager"
      badge={badge}
    />
  );
}
