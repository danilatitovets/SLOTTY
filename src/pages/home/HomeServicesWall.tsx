import type { FC } from 'react';
import type { IconType } from 'react-icons';
import {
  HiBeaker,
  HiBolt,
  HiCalendarDays,
  HiEye,
  HiFaceSmile,
  HiFire,
  HiHandRaised,
  HiHeart,
  HiPaintBrush,
  HiScissors,
  HiSparkles,
  HiSun,
  HiUser,
} from 'react-icons/hi2';

type ServiceChip = {
  label: string;
  icon: IconType;
  iconBg: string;
  iconColor: string;
};

const ALL_SERVICES: ServiceChip[] = [
  { label: 'Маникюр', icon: HiSparkles, iconBg: '#FCE7F3', iconColor: '#DB2777' },
  { label: 'Кроп', icon: HiScissors, iconBg: '#E0E7FF', iconColor: '#4338CA' },
  { label: 'Стрижка', icon: HiScissors, iconBg: '#E5E7EB', iconColor: '#111827' },
  { label: 'Педикюр', icon: HiHandRaised, iconBg: '#FEF3C7', iconColor: '#B45309' },
  { label: 'Окрашивание', icon: HiPaintBrush, iconBg: '#F3E8FF', iconColor: '#7C3AED' },
  { label: 'Мелирование', icon: HiSun, iconBg: '#FFEDD5', iconColor: '#C2410C' },
  { label: 'Укладка', icon: HiSparkles, iconBg: '#FFE4E6', iconColor: '#E11D48' },
  { label: 'Брови', icon: HiEye, iconBg: '#ECFDF5', iconColor: '#047857' },
  { label: 'Ресницы', icon: HiEye, iconBg: '#D1FAE5', iconColor: '#065F46' },
  { label: 'Ламинирование', icon: HiEye, iconBg: '#F0FDFA', iconColor: '#0F766E' },
  { label: 'Наращивание', icon: HiSparkles, iconBg: '#FAE8FF', iconColor: '#A21CAF' },
  { label: 'Чистка лица', icon: HiFaceSmile, iconBg: '#E0F2FE', iconColor: '#0369A1' },
  { label: 'Массаж лица', icon: HiHeart, iconBg: '#FFF1F2', iconColor: '#BE123C' },
  { label: 'Барбершоп', icon: HiUser, iconBg: '#F5F5F4', iconColor: '#44403C' },
  { label: 'Детская', icon: HiScissors, iconBg: '#DBEAFE', iconColor: '#1D4ED8' },
  { label: 'Гель-лак', icon: HiSparkles, iconBg: '#FDF2F8', iconColor: '#BE185D' },
  { label: 'Снятие', icon: HiBeaker, iconBg: '#F1F5F9', iconColor: '#475569' },
  { label: 'SPA', icon: HiHeart, iconBg: '#FCE7F3', iconColor: '#9D174D' },
  { label: 'Японский', icon: HiHandRaised, iconBg: '#FEF9C3', iconColor: '#A16207' },
  { label: 'Аппаратный', icon: HiBolt, iconBg: '#CCFBF1', iconColor: '#0F766E' },
  { label: 'Шугаринг', icon: HiFire, iconBg: '#FEE2E2', iconColor: '#B91C1C' },
  { label: 'Эпиляция', icon: HiFire, iconBg: '#FFEDD5', iconColor: '#9A3412' },
  { label: 'Татуаж', icon: HiPaintBrush, iconBg: '#EDE9FE', iconColor: '#6D28D9' },
  { label: 'Макияж', icon: HiPaintBrush, iconBg: '#F5D0FE', iconColor: '#86198F' },
  { label: 'Спина', icon: HiHeart, iconBg: '#DCFCE7', iconColor: '#15803D' },
  { label: 'Лимфодренаж', icon: HiHeart, iconBg: '#E0F2FE', iconColor: '#075985' },
  { label: 'Тайский', icon: HiHeart, iconBg: '#FEF3C7', iconColor: '#92400E' },
  { label: 'Тату', icon: HiPaintBrush, iconBg: '#1F2937', iconColor: '#F9FAFB' },
  { label: 'Кератин', icon: HiSparkles, iconBg: '#F3F4F6', iconColor: '#374151' },
  { label: 'Восстановление', icon: HiBeaker, iconBg: '#DBEAFE', iconColor: '#1E40AF' },
  { label: 'Ногти', icon: HiHandRaised, iconBg: '#FCE7F3', iconColor: '#DB2777' },
  { label: 'Дизайн', icon: HiSparkles, iconBg: '#FDF4FF', iconColor: '#C026D3' },
  { label: 'Френч', icon: HiSparkles, iconBg: '#EFF6FF', iconColor: '#2563EB' },
  { label: 'Причёска', icon: HiScissors, iconBg: '#FFF7ED', iconColor: '#C2410C' },
  { label: 'Вечерний', icon: HiFaceSmile, iconBg: '#FCE7F3', iconColor: '#9F1239' },
  { label: 'Контуринг', icon: HiFaceSmile, iconBg: '#F5F3FF', iconColor: '#5B21B6' },
  { label: 'Фитнес', icon: HiBolt, iconBg: '#ECFCCB', iconColor: '#3F6212' },
  { label: 'Йога', icon: HiUser, iconBg: '#D1FAE5', iconColor: '#047857' },
  { label: 'Стретчинг', icon: HiUser, iconBg: '#CFFAFE', iconColor: '#0E7490' },
  { label: 'Онлайн', icon: HiCalendarDays, iconBg: '#FFE4E6', iconColor: '#F43F5E' },
];

function splitRows(items: ServiceChip[], rows: number): ServiceChip[][] {
  const result: ServiceChip[][] = Array.from({ length: rows }, () => []);
  items.forEach((item, i) => {
    result[i % rows]!.push(item);
  });
  return result;
}

function ServicePill({ label, icon: Icon, iconBg, iconColor }: ServiceChip) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-black/5 bg-white px-2.5 py-1.5 shadow-[0_8px_20px_rgba(15,23,42,0.06)] sm:gap-2.5 sm:px-3 sm:py-2">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] sm:h-8 sm:w-8"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="h-4 w-4 sm:h-[17px] sm:w-[17px]" style={{ color: iconColor }} aria-hidden />
      </span>
      <span className="max-w-[11rem] truncate text-[13px] font-semibold tracking-[-0.01em] text-[#111827] sm:text-[14px]">
        {label}
      </span>
    </span>
  );
}

function MarqueeRow({
  items,
  reverse = false,
  offsetClass = '',
}: {
  items: ServiceChip[];
  reverse?: boolean;
  offsetClass?: string;
}) {
  const track = [...items, ...items];

  return (
    <div className={`overflow-hidden ${offsetClass}`}>
      <div
        className={`flex w-max gap-2 py-1 sm:gap-3 motion-reduce:animate-none ${
          reverse ? 'animate-services-marquee-right' : 'animate-services-marquee-left'
        }`}
      >
        {track.map((item, index) => (
          <ServicePill key={`${item.label}-${index}`} {...item} />
        ))}
      </div>
    </div>
  );
}

const [ROW_A, ROW_B, ROW_C] = splitRows(ALL_SERVICES, 3);

export const HomeServicesWall: FC = () => {
  return (
    <section
      className="relative left-1/2 mt-12 w-[100vw] max-w-[100vw] -translate-x-1/2 border-y border-[#ECECEC] bg-white py-10 sm:mt-14 sm:py-12"
      aria-label="Услуги на SLOTTY"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent sm:w-20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent sm:w-20" />

      <div className="space-y-4 sm:space-y-5">
        <MarqueeRow items={ROW_A} />
        <MarqueeRow items={ROW_B} reverse offsetClass="sm:pl-10" />
        <MarqueeRow items={ROW_C} offsetClass="sm:pl-5" />
      </div>
    </section>
  );
};
