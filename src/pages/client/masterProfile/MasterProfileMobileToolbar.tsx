import { useEffect, useState } from 'react';
import { catalogDesktopPanel } from './masterProfileTheme';
import { MasterProfileToolbarInner } from './MasterProfileToolbarInner';

type Props = {
  masterName: string;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
  onShare: () => void;
  onReport?: () => void;
  favoriteDisabled?: boolean;
};

export function MasterProfileMobileToolbar({
  masterName,
  isFavorite,
  onFavoriteToggle,
  onShare,
  onReport,
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
      className={`sticky z-40 top-[max(0.25rem,env(safe-area-inset-top,0px))] ${
        compact
          ? '-mx-4 border-b border-[#EEEEEE] bg-white px-4 py-2.5 shadow-[0_4px_16px_rgba(17,24,39,0.06)]'
          : 'bg-transparent pb-2 pt-1'
      }`}
    >
      {compact ? (
        <MasterProfileToolbarInner
          masterName={masterName}
          compact
          isFavorite={isFavorite}
          onFavoriteToggle={onFavoriteToggle}
          onShare={onShare}
          onReport={onReport}
          favoriteDisabled={favoriteDisabled}
        />
      ) : (
        <div className={`${catalogDesktopPanel} px-4 py-2.5`}>
          <MasterProfileToolbarInner
            masterName={masterName}
            compact={false}
            isFavorite={isFavorite}
            onFavoriteToggle={onFavoriteToggle}
            onShare={onShare}
            onReport={onReport}
            favoriteDisabled={favoriteDisabled}
          />
        </div>
      )}
    </div>
  );
}
