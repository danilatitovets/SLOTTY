import { HiCheckBadge, HiShieldCheck, HiSparkles } from 'react-icons/hi2';
import { masterShowsVerifiedBadge } from '../../../features/masters/lib/masterVerifiedBadge';

type Props = {
  master: {
    isVerified?: boolean;
  };
  hasAvailableSlot?: boolean;
};

export function MasterProfileTrustChips({ master, hasAvailableSlot = false }: Props) {
  const verified = masterShowsVerifiedBadge(master);
  const items: Array<{ key: string; label: string; icon: typeof HiCheckBadge; tone: string }> = [];

  if (verified) {
    items.push({
      key: 'verified',
      label: 'Подтверждённый профиль',
      icon: HiCheckBadge,
      tone: 'bg-[#FFF1F4] text-[#C02658] ring-[#F47C8C]/12',
    });
  }
  items.push({
    key: 'safe',
    label: 'Безопасная запись',
    icon: HiShieldCheck,
    tone: 'bg-[#F5F5F5] text-[#374151] ring-[#EBEBEB]',
  });
  if (hasAvailableSlot) {
    items.push({
      key: 'slot',
      label: 'Свободен для записи',
      icon: HiSparkles,
      tone: 'bg-[#ECFDF3] text-[#15803D] ring-[#22C55E]/12',
    });
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map(({ key, label, icon: Icon, tone }) => (
        <span
          key={key}
          className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${tone}`}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">{label}</span>
        </span>
      ))}
    </div>
  );
}
