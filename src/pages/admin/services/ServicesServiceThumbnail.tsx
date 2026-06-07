import { HiScissors } from 'react-icons/hi2';
import { servicesIconCircle } from './adminServicesTheme';

export function ServiceThumbnail({
  src,
  title,
  sizeClass,
  edge = 'default',
}: {
  src: string;
  title: string;
  sizeClass: string;
  edge?: 'default' | 'flush-left';
}) {
  const edgeClass =
    edge === 'flush-left'
      ? 'h-full w-full rounded-l-[16px] rounded-r-none lg:rounded-l-[18px]'
      : 'ring-1 ring-[#EAECEF]/80';

  return (
    <span
      className={`relative shrink-0 overflow-hidden bg-[#f6f7fb] ${edgeClass} ${sizeClass}`}
    >
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover object-center"
        decoding="async"
      />
      <span className="sr-only">{title}</span>
    </span>
  );
}

export function ServiceThumbnailFallback({
  sizeClass,
  edge = 'default',
}: {
  sizeClass: string;
  edge?: 'default' | 'flush-left';
}) {
  const edgeClass =
    edge === 'flush-left'
      ? 'h-full w-full rounded-l-[16px] rounded-r-none lg:rounded-l-[18px]'
      : '';

  return (
    <span className={`${servicesIconCircle} shrink-0 ${edgeClass} ${sizeClass}`}>
      <HiScissors className="h-7 w-7" aria-hidden />
    </span>
  );
}
