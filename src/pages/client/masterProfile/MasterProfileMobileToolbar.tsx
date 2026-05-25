import { useEffect, useState } from 'react';
import { catalogDesktopPanel, masterProfileMobileToolbarStickyClass } from './masterProfileTheme';
import { MasterProfileToolbarInner } from './MasterProfileToolbarInner';

type Props = {
  masterName: string;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
  onShare: () => void;
  favoriteDisabled?: boolean;
};

export function MasterProfileMobileToolbar({
  masterName,
  isFavorite,
  onFavoriteToggle,
  onShare,
  favoriteDisabled = false,
}: Props) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={`${masterProfileMobileToolbarStickyClass} top-[max(0.25rem,env(safe-area-inset-top,0px))]`}
    >
      <div className={`${catalogDesktopPanel} px-4 py-2.5 xl:px-6`}>
        <MasterProfileToolbarInner
          masterName={masterName}
          compact={compact}
          isFavorite={isFavorite}
          onFavoriteToggle={onFavoriteToggle}
          onShare={onShare}
          favoriteDisabled={favoriteDisabled}
        />
      </div>
    </div>
  );
}
