import type { FC } from 'react';
import { HomeHero, type HomeHeroProps } from './HomeHero';
import { HomeTooHero } from './HomeTooHero';

const belowHeroShell =
  'mx-auto w-full max-w-[1320px] px-4 pb-3 sm:px-6 sm:pb-6 xl:px-10';

export const HomeHeroStack: FC<HomeHeroProps> = (props) => {
  return (
    <div className="w-full">
      <HomeHero {...props} />
      <div className={belowHeroShell}>
        <HomeTooHero />
      </div>
    </div>
  );
};
