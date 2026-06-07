import type { ReactNode } from 'react';
import { MasterCabinetCoverBanner } from '../../admin/profile/adminProfilePortrait';
import { MasterCardPortrait } from '../components/MasterCardPortrait';
import type { ExtendedMasterProfile } from './types';

type Props = {
  master: ExtendedMasterProfile;
  heightClass?: string;
  className?: string;
  children?: ReactNode;
};

/** Фоновая обложка публичного профиля (как в кабинете мастера). */
export function MasterPublicCoverBanner({
  master,
  heightClass = 'h-[180px] sm:h-[220px] lg:h-[240px]',
  className = '',
  children,
}: Props) {
  return (
    <div className={className}>
      <MasterCabinetCoverBanner
        name={master.masterName}
        dedicatedCoverUrl={master.coverUrl}
        photoUrl={master.photoUrl}
        heightClass={heightClass}
      >
        {children}
      </MasterCabinetCoverBanner>
    </div>
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
    <div
      className={`relative box-border shrink-0 rounded-[18px] bg-white p-1.5 lg:rounded-[20px] lg:p-2 ${className}`}
    >
      <MasterCardPortrait
        masterName={master.masterName}
        photoUrl={master.photoUrl}
        className="relative h-full w-full overflow-hidden rounded-[12px] bg-[#F6F6F7] lg:rounded-[14px]"
        imageClassName="h-full w-full rounded-[12px] object-cover object-center lg:rounded-[14px]"
        photoMaxEdge={512}
        loading="eager"
        badge={badge}
      />
    </div>
  );
}
