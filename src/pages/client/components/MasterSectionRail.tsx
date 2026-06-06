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

  return (
    <section className={inset ? '-mx-4 sm:-mx-5' : ''}>
      <div className={inset ? 'px-4 sm:px-5' : ''}>
        <SectionHeading title={title} subtitle={subtitle} />
      </div>
      <div
        className={`flex items-stretch gap-3 overflow-x-auto py-1.5 pb-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          inset ? 'px-4 sm:px-5' : ''
        }`}
      >
        {items.map((listing) => (
          <div
            key={listing.masterId}
            className="h-[25rem] w-[min(88vw,340px)] shrink-0 snap-start"
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
