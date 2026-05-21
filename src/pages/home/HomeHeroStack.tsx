import type { FC } from 'react';
import { HomeHero, type HomeHeroProps } from './HomeHero';
import { HomeTooHero } from './HomeTooHero';
import { homeShell } from './homeLayout';

export const HomeHeroStack: FC<HomeHeroProps> = (props) => {
  return (
    <div className={`${homeShell} pb-4 pt-[calc(5.25rem+env(safe-area-inset-top,0px))] sm:pb-6`}>
      <HomeHero {...props} />
      <HomeTooHero />
    </div>
  );
};
