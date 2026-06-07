import { useCallback, useMemo, useState } from 'react';
import {
  HiCalendarDays,
  HiCheckCircle,
  HiHeart,
  HiPhone,
  HiShieldCheck,
  HiStar,
} from 'react-icons/hi2';
import type { DemoMasterService } from '../../../features/services/model/demoMasters';
import { resolveFilledContacts } from '../../../features/master-onboarding/model/masterContacts';
import type { MasterTopAchievement } from '../lib/resolveMasterTopRankStatus';
import type { ExtendedMasterProfile, NearestSlotInfo } from './types';
import {
  formatServicePrice,
  openPhoneDial,
  resolveMasterCallablePhone,
  telegramUrlFromContact,
} from './masterProfileUtils';
import { formatBookingsLabel, resolveMasterProfileMetrics, resolveMinServicePrice, formatMinServicePriceLabel } from './masterProfileMetrics';
import {
  catalogPrimaryBtn,
  catalogSecondaryBtn,
  masterProfileSidebarColClass,
  masterProfileCard,
  masterProfileMutedPanel,
} from './masterProfileTheme';

type Props = {
  master: ExtendedMasterProfile;
  nearest?: NearestSlotInfo | null;
  nearestLoading?: boolean;
  topAchievements?: MasterTopAchievement[];
  isFavorite: boolean;
  favoriteDisabled?: boolean;
  onChooseTime: (serviceId?: string | null) => void;
  onFavoriteToggle: () => void;
  onPhoneUnavailable?: () => void;
};

export function MasterProfileBookingCard({
  master,
  nearest,
  nearestLoading,
  topAchievements = [],
  isFavorite,
  favoriteDisabled = false,
  onChooseTime,
  onFavoriteToggle,
  onPhoneUnavailable,
}: Props) {
  const [selectedServiceId, setSelectedServiceId] = useState(
    () => nearest?.serviceId ?? master.services[0]?.id ?? '',
  );

  const selectedService = useMemo(
    () => master.services.find((s) => s.id === selectedServiceId) ?? master.services[0] ?? null,
    [master.services, selectedServiceId],
  );

  const callablePhone = useMemo(
    () => resolveMasterCallablePhone(master.phone, master.contact),
    [master.contact, master.phone],
  );
  const contacts = resolveFilledContacts({ contact: master.contact, contacts: master.contacts });
  const telegramUrl = useMemo(() => {
    const tg = contacts.find((c) => c.type === 'telegram');
    if (tg?.value) return telegramUrlFromContact(tg.value);
    return master.contact ? telegramUrlFromContact(master.contact) : null;
  }, [contacts, master.contact]);

  const hasSlot = Boolean(nearest?.label);
  const metrics = resolveMasterProfileMetrics(master);
  const minPrice = resolveMinServicePrice(master);
  const priceLabel = selectedService
    ? formatServicePrice(selectedService)
    : formatMinServicePriceLabel(minPrice);
  const primaryTop = topAchievements[0] ?? null;

  const handleCall = useCallback(() => {
    if (callablePhone && openPhoneDial(callablePhone)) return;
    onPhoneUnavailable?.();
  }, [callablePhone, onPhoneUnavailable]);

  const trustFacts: string[] = [];
  if (metrics.ratingLabel && !metrics.isNewMaster) {
    trustFacts.push(`Рейтинг ${metrics.ratingLabel}`);
  }
  if (metrics.bookingsCount) {
    trustFacts.push(formatBookingsLabel(metrics.bookingsCount));
  }
  trustFacts.push('Безопасная запись через Slotty');
  if (primaryTop) {
    trustFacts.push(primaryTop.title);
  }

  return (
    <div className={masterProfileSidebarColClass}>
      <div className={`${masterProfileCard} box-border w-full space-y-4 p-5`}>
        <div>
          <p className="text-[20px] font-bold tracking-[-0.03em] text-[#111827]">Запись</p>
          <p className="mt-0.5 text-[14px] text-[#6B7280]">Выберите услугу и удобное время</p>
        </div>

        <div className={`${masterProfileMutedPanel} p-4`}>
          <p className="text-[12px] font-medium text-[#8E8E93]">Ближайшее окно</p>
          <p className="mt-1 text-[16px] font-bold text-[#111827]">
            {nearestLoading
              ? 'Загрузка…'
              : hasSlot
                ? nearest!.label
                : 'Свободных окон пока нет'}
          </p>
        </div>

        {master.services.length > 0 ? (
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-[#8E8E93]">Услуга</span>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="h-11 w-full rounded-[12px] border-0 bg-[#F5F5F5] px-3 text-[14px] font-semibold text-[#111827] outline-none focus:bg-[#EBEBEB]"
            >
              {master.services.map((service: DemoMasterService) => (
                <option key={service.id} value={service.id}>
                  {service.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="rounded-[12px] bg-[#FFF1F4] px-4 py-3">
          <p className="text-[12px] font-medium text-[#8E8E93]">Стоимость</p>
          <p className="mt-0.5 text-[20px] font-bold tracking-[-0.02em] text-[#111827]">{priceLabel}</p>
        </div>

        <button
          type="button"
          onClick={() => onChooseTime(selectedService?.id ?? nearest?.serviceId)}
          className={`${catalogPrimaryBtn} w-full min-h-[48px] gap-2`}
        >
          <HiCalendarDays className="h-5 w-5" aria-hidden />
          {hasSlot ? 'Выбрать время' : master.services.length ? 'Смотреть услуги' : 'Записаться'}
        </button>

        {callablePhone ? (
          <button type="button" onClick={handleCall} className={`${catalogSecondaryBtn} w-full min-h-[44px] gap-2`}>
            <HiPhone className="h-4 w-4" aria-hidden />
            Позвонить мастеру
          </button>
        ) : null}

        {telegramUrl ? (
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${catalogSecondaryBtn} w-full min-h-[44px] gap-2`}
          >
            Написать в Telegram
          </a>
        ) : null}

        <ul className="space-y-2 border-t border-[#F0F0F0] pt-4">
          {trustFacts.map((fact) => (
            <li key={fact} className="flex items-start gap-2 text-[13px] text-[#374151]">
              <HiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#F47C8C]" aria-hidden />
              <span>{fact}</span>
            </li>
          ))}
          {metrics.isNewMaster ? (
            <li className="flex items-start gap-2 text-[13px] text-[#6B7280]">
              <HiStar className="mt-0.5 h-4 w-4 shrink-0 text-[#F59E0B]" aria-hidden />
              <span>Недавно на Slotty — будем рады первым клиентам</span>
            </li>
          ) : null}
          <li className="flex items-start gap-2 text-[13px] text-[#374151]">
            <HiShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#F47C8C]" aria-hidden />
            <span>Запись и напоминания через Slotty</span>
          </li>
        </ul>

        <button
          type="button"
          onClick={onFavoriteToggle}
          disabled={favoriteDisabled}
          className={`${catalogSecondaryBtn} w-full min-h-[44px] gap-2 ${
            isFavorite ? 'text-[#F47C8C]' : ''
          }`}
        >
          <HiHeart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} aria-hidden />
          {isFavorite ? 'В избранном' : 'Подписаться на мастера'}
        </button>
      </div>
    </div>
  );
}
