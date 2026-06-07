import type { ExtendedMasterProfile } from './types';
import { MasterPublicCoverBanner } from './MasterPublicCoverBanner';

type Props = {
  master: ExtendedMasterProfile;
  layout?: 'desktop' | 'mobile';
  className?: string;
};

/** Обложка профиля на всю ширину viewport (Kwork-style). */
export function MasterPublicHeroCover({ master, layout = 'desktop', className = '' }: Props) {
  const isMobile = layout === 'mobile';
  const coverHeight = isMobile ? 'h-[160px]' : 'h-[200px] sm:h-[240px] lg:h-[260px]';

  return (
    <div className={`relative w-full ${className}`} data-master-profile-cover={layout}>
      <MasterPublicCoverBanner master={master} heightClass={coverHeight} className="w-full" />
    </div>
  );
}
