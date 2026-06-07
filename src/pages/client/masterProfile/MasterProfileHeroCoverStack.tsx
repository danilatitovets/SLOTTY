import type { ReactNode } from 'react';
import type { ExtendedMasterProfile } from './types';
import { MasterPublicHeroCover } from './MasterPublicHeroCover';

type Props = {
  master: ExtendedMasterProfile;
  layout?: 'desktop' | 'mobile';
  toolbar?: ReactNode;
};

/** Обложка на всю ширину + toolbar поверх (без отступа в потоке). */
export function MasterProfileHeroCoverStack({ master, layout = 'desktop', toolbar }: Props) {
  return (
    <div className="relative w-full" data-master-profile-hero>
      <MasterPublicHeroCover master={master} layout={layout} />
      {toolbar}
    </div>
  );
}
