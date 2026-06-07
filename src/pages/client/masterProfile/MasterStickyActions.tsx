import { useCallback, useMemo } from 'react';
import { HiCalendarDays, HiPhone } from 'react-icons/hi2';
import { clientPinkBtn, clientOutlineBtn } from '../clientTheme';
import { openPhoneDial, resolveMasterCallablePhone } from './masterProfileUtils';
import type { ExtendedMasterProfile, NearestSlotInfo } from './types';
import { formatMinServicePriceLabel, resolveMinServicePrice } from './masterProfileMetrics';

type Props = {
  master: ExtendedMasterProfile;
  onChooseTime: () => void;
  phone?: string;
  contact?: string;
  nearest?: NearestSlotInfo | null;
  nearestLoading?: boolean;
  onPhoneUnavailable?: () => void;
};

export function MasterStickyActions({
  master,
  onChooseTime,
  phone,
  contact,
  nearest,
  nearestLoading,
  onPhoneUnavailable,
}: Props) {
  const callablePhone = useMemo(
    () => resolveMasterCallablePhone(phone, contact),
    [contact, phone],
  );
  const hasSlot = Boolean(nearest?.label);
  const minPrice = resolveMinServicePrice(master);
  const priceLabel = formatMinServicePriceLabel(minPrice);

  const handleCall = useCallback(() => {
    if (callablePhone && openPhoneDial(callablePhone)) return;
    onPhoneUnavailable?.();
  }, [callablePhone, onPhoneUnavailable]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#EEEEEE] bg-white/98 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-2.5 backdrop-blur-sm">
      <div className="mx-auto max-w-lg">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-[#8E8E93]">{priceLabel}</p>
            <p className="truncate text-[14px] font-bold text-[#111827]">
              {nearestLoading
                ? 'Ищем окно…'
                : hasSlot
                  ? nearest!.label
                  : 'Нет свободных окон'}
            </p>
          </div>
          <button type="button" onClick={onChooseTime} className={`${clientPinkBtn} min-h-11 shrink-0 px-5 gap-2`}>
            <HiCalendarDays className="h-5 w-5" aria-hidden />
            Записаться
          </button>
        </div>
        {callablePhone ? (
          <button type="button" onClick={handleCall} className={`${clientOutlineBtn} w-full min-h-10 gap-2 text-[13px]`}>
            <HiPhone className="h-4 w-4" aria-hidden />
            Позвонить
          </button>
        ) : null}
      </div>
    </div>
  );
}
