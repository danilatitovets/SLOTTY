import { HiChevronRight } from 'react-icons/hi2';
import { ServicesBrandPhotoLayers } from './ServicesBrandPhotoLayers';

type Props = {
  label?: string;
  value: string;
  actionLabel?: string;
  onClick?: () => void;
};

export function ServicesSheetPriceHero({
  label = 'Цена в каталоге',
  value,
  actionLabel = 'Изменить',
  onClick,
}: Props) {
  const shellClass =
    'relative w-full overflow-hidden rounded-[14px] bg-[#EF4444] px-4 py-3.5 text-left sm:px-5';

  const content = (
    <>
      <ServicesBrandPhotoLayers roundedClassName="rounded-[14px]" />
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#111827]/75">
            {label}
          </span>
          <p className="mt-1 text-[26px] font-black tabular-nums leading-none tracking-[-0.05em] text-[#111827] sm:text-[30px]">
            {value}
          </p>
        </div>
        {onClick ? (
          <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-[#111827]">
            {actionLabel}
            <HiChevronRight className="h-4 w-4" aria-hidden />
          </span>
        ) : null}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${shellClass} transition hover:opacity-95 active:scale-[0.99]`}>
        {content}
      </button>
    );
  }

  return <div className={shellClass}>{content}</div>;
}
