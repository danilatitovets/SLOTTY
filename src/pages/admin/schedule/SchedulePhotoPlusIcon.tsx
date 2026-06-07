import { HiPlus } from 'react-icons/hi2';
import { SCHEDULE_QUICK_SETUP_IMAGES } from './scheduleQuickSetupAssets';

type Props = {
  className?: string;
  size?: 'sm' | 'md';
};

const SIZE_CLASS = {
  sm: 'h-8 w-8 rounded-[8px]',
  md: 'h-9 w-9 rounded-[10px]',
} as const;

const ICON_CLASS = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
} as const;

export function SchedulePhotoPlusIcon({ className = '', size = 'md' }: Props) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden text-white ${SIZE_CLASS[size]} ${className}`.trim()}
      aria-hidden
    >
      <span
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${SCHEDULE_QUICK_SETUP_IMAGES.tabCreateActiveBg})` }}
      />
      <span className="pointer-events-none absolute inset-0 bg-[#3B4CCA]/25" />
      <HiPlus className={`relative z-10 stroke-[2.5px] drop-shadow-sm ${ICON_CLASS[size]}`} />
    </span>
  );
}
