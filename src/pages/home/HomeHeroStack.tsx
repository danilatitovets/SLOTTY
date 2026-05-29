import type { FC } from 'react';
import { HomeHero, type HomeHeroProps } from './HomeHero';
import { HomeTooHero } from './HomeTooHero';

const belowHeroShell =
  'relative z-20 mx-auto -mt-10 w-full max-w-[1320px] px-4 sm:-mt-14 sm:px-6 xl:px-10';

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
