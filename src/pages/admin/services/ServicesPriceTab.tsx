import type { ReactNode } from 'react';
import { HiPencilSquare, HiWallet } from 'react-icons/hi2';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import {
  servicesCard,
  servicesCatalogCardMobile,
  servicesTabContentPad,
  servicesTabPanelShell,
  servicesTabScrollBottomPad,
} from './adminServicesTheme';
import type { ManagedService } from './servicesFormat';
import { formatServicePrice, serviceCatalogThumbnailUrl } from './servicesFormat';
import { ServiceThumbnail, ServiceThumbnailFallback } from './ServicesServiceThumbnail';

type Props = {
  draft: MasterDraft;
  services: ManagedService[];
  onEditPrice: (service: ManagedService) => void;
};

function QuickEditButton({
  label,
  value,
  hint,
  icon,
  onClick,
  className = '',
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full flex-col rounded-[10px] bg-[#EBEBEB] px-4 py-3.5 text-left transition hover:bg-[#E4E4E4] active:scale-[0.99] lg:min-h-[104px] lg:rounded-[10px] lg:px-5 lg:py-4 ${className}`}
    >
      <span className="flex items-center gap-2 text-[12px] font-medium text-[#6B7280]">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#F5F5F5] text-[#6B7280]">
          {icon}
        </span>
        {label}
        <HiPencilSquare
          className="ml-auto h-4 w-4 text-[#9CA3AF] transition group-hover:text-[#6B7280]"
          aria-hidden
        />
      </span>
      <span className="mt-2 text-[22px] font-bold tabular-nums leading-none tracking-[-0.04em] text-[#111827] lg:text-[26px]">
        {value}
      </span>
      <span className="mt-1.5 text-[12px] font-medium text-[#9CA3AF] lg:text-[13px]">
        {hint}
      </span>
    </button>
  );
}

function PriceServiceCard({
  service,
  imageSrc,
  onEditPrice,
}: {
  service: ManagedService;
  imageSrc: string;
  onEditPrice: () => void;
}) {
  return (
    <li
      className={`${servicesCatalogCardMobile} lg:rounded-[24px] lg:border lg:border-[#EAECEF] lg:p-0 lg:shadow-[0_2px_16px_rgba(17,24,39,0.04)]`}
    >
      <div className="lg:hidden">
        <div className="flex items-start gap-3.5">
          <ServiceThumbnail
            src={imageSrc}
            title={service.title}
            sizeClass="h-[4.5rem] w-[4.5rem] shrink-0 rounded-[14px]"
          />
          <h3 className="min-w-0 flex-1 text-[17px] font-bold leading-snug tracking-[-0.03em] text-[#111827]">
            {service.title}
          </h3>
        </div>
        <div className="mt-3">
          <QuickEditButton
            label="Цена"
            value={formatServicePrice(service)}
            hint="Нажмите, чтобы изменить"
            icon={<HiWallet className="h-4 w-4 shrink-0" aria-hidden />}
            onClick={onEditPrice}
          />
        </div>
      </div>

      <div className="hidden lg:grid lg:min-h-[120px] lg:grid-cols-[5rem_minmax(0,1fr)_12.5rem] lg:items-center lg:gap-6 lg:px-6 lg:py-5">
        <ServiceThumbnail
          src={imageSrc}
          title={service.title}
          sizeClass="h-20 w-20 rounded-[20px]"
        />

        <div className="min-w-0">
          <h3 className="line-clamp-2 text-[20px] font-black leading-tight tracking-[-0.05em] text-[#111827] xl:text-[22px]">
            {service.title}
          </h3>
          <p className="mt-1.5 text-[13px] font-semibold text-[#9CA3AF]">
            Нажмите на цену справа, чтобы быстро изменить
          </p>
        </div>

        <QuickEditButton
          label="Цена"
          value={formatServicePrice(service)}
          hint="Изменить цену"
          icon={<HiWallet className="h-4 w-4 shrink-0" aria-hidden />}
          onClick={onEditPrice}
          className="w-full max-w-[12.5rem] justify-self-end"
        />
      </div>
    </li>
  );
}

export function ServicesPriceTab({ draft, services, onEditPrice }: Props) {
  return (
    <div className={servicesTabPanelShell}>
      <div className={`${servicesTabContentPad} ${servicesTabScrollBottomPad}`}>
        <div className="hidden lg:block">
          <h2 className="text-[22px] font-black tracking-[-0.05em] text-[#111827]">
            Быстрое редактирование прайса
          </h2>

        </div>

        {services.length === 0 ? (
          <div className={`${servicesCard} p-6 text-center`}>
            <ServiceThumbnailFallback sizeClass="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px]" />
            <p className="mt-4 text-[15px] font-semibold text-[#6B7280]">
              Добавьте услуги в каталоге
            </p>
          </div>
        ) : (
          <ul className="flex w-full max-w-none flex-col gap-3 lg:gap-4 lg:rounded-[24px] lg:bg-[#f6f7fb] lg:p-4">
            {services.map((service) => (
              <PriceServiceCard
                key={service.id}
                service={service}
                imageSrc={serviceCatalogThumbnailUrl(service, draft)}
                onEditPrice={() => onEditPrice(service)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
