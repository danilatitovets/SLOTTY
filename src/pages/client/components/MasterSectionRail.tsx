import type { ServiceListingRecord } from '../../../features/services/model/demoMasters';
import { MasterCard } from './MasterCard';
import { SectionHeading } from './SectionHeading';

type Props = {
  title: string;
  subtitle?: string;
  items: ServiceListingRecord[];
  userLat: number | null;
  userLng: number | null;
  /** false на desktop — без отрицательных отступов */
  inset?: boolean;
};

export function MasterSectionRail({
  title,
  subtitle,
  items,
  userLat,
  userLng,
  inset = true,
}: Props) {
  if (!items.length) return null;

  const insetPad = inset ? 'px-3' : '';
  const insetBleed = inset ? '-mx-3' : '';

  return (
    <section className={insetBleed}>
      <div className={insetPad}>
        <SectionHeading title={title} subtitle={subtitle} />
      </div>

      <div className={`flex flex-col gap-2.5 ${insetPad} lg:hidden`}>
        {items.map((listing) => (
          <MasterCard
            key={listing.masterId}
            listing={listing}
            userLat={userLat}
            userLng={userLng}
            layout="list"
          />
        ))}
      </div>

      <div
        className={`hidden items-stretch gap-3 overflow-x-auto py-1.5 pb-1 snap-x snap-mandatory [scrollbar-width:none] lg:flex [&::-webkit-scrollbar]:hidden ${
          inset ? 'px-2.5' : ''
        }`}
      >
        {items.map((listing) => (
          <div
            key={listing.masterId}
            className="h-[25rem] w-[min(22rem,calc(100vw-2.5rem))] shrink-0 snap-start"
          >
            <MasterCard
              listing={listing}
              userLat={userLat}
              userLng={userLng}
              layout="carousel"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
