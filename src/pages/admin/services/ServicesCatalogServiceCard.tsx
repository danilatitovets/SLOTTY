import { HiEllipsisHorizontal } from 'react-icons/hi2';
import { servicesCatalogCardMobile } from './adminServicesTheme';
import { ServiceThumbnail, ServiceThumbnailFallback } from './ServicesServiceThumbnail';
import type { ManagedService } from './servicesFormat';
import { formatServicePrice } from './servicesFormat';

type Props = {
  service: ManagedService;
  imageSrc: string | null;
  onOpenMenu?: (service: ManagedService) => void;
  highlighted?: boolean;
  /** Показать кнопку «⋯» (в онбординге — только просмотр списка). */
  showMenu?: boolean;
};

/** Карточка услуги в каталоге кабинета (мобилка + десктоп). */
export function CatalogServiceCard({
  service,
  imageSrc,
  onOpenMenu,
  highlighted = false,
  showMenu = true,
}: Props) {
  const visible = service.isActive !== false;

  return (
    <li
      className={`${servicesCatalogCardMobile} ${
        highlighted ? 'ring-2 ring-[#F47C8C]/35 ring-offset-2 ring-offset-white' : ''
      }`}
    >
      <div className="lg:hidden">
        <div className="flex items-start gap-3.5">
          {imageSrc ? (
            <ServiceThumbnail
              src={imageSrc}
              title={service.title}
              sizeClass="h-[4.5rem] w-[4.5rem] shrink-0 rounded-[14px]"
            />
          ) : (
            <ServiceThumbnailFallback sizeClass="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-[14px]" />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-[17px] font-bold leading-snug tracking-[-0.03em] text-[#111827]">
                  {service.title}
                </h3>
                <p className="mt-2 text-[20px] font-black tabular-nums leading-none tracking-[-0.04em] text-[#F47C8C]">
                  {formatServicePrice(service)}
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    visible ? 'bg-[#ECFDF5] text-[#16A34A]' : 'bg-[#F3F4F6] text-[#6B7280]'
                  }`}
                >
                  {visible ? 'Видимая' : 'Скрытая'}
                </span>
              </div>

              {showMenu && onOpenMenu ? (
                <button
                  type="button"
                  onClick={() => onOpenMenu(service)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#F5F5F5] text-[#6B7280] transition active:scale-[0.96]"
                  aria-label="Меню услуги"
                >
                  <HiEllipsisHorizontal className="h-5 w-5" aria-hidden />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden min-h-[120px] items-center gap-5 px-6 py-5 lg:flex">
        {imageSrc ? (
          <ServiceThumbnail
            src={imageSrc}
            title={service.title}
            sizeClass="h-20 w-20 rounded-[20px]"
          />
        ) : (
          <ServiceThumbnailFallback sizeClass="flex h-20 w-20 items-center justify-center rounded-[20px]" />
        )}

        <div className="min-w-0 flex-1">
          <h3 className="text-[22px] font-black leading-tight tracking-[-0.05em] text-[#111827]">
            {service.title}
          </h3>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[32px] font-black tabular-nums leading-none tracking-[-0.06em] text-[#ff5f7a]">
            {formatServicePrice(service)}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold ${
            visible ? 'bg-[#ECFDF5] text-[#16A34A]' : 'bg-[#f6f7fb] text-[#6B7280]'
          }`}
        >
          {visible ? 'Видимая' : 'Скрытая'}
        </span>

        {showMenu && onOpenMenu ? (
          <button
            type="button"
            onClick={() => onOpenMenu(service)}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#EBEBEB] text-[#6B7280] transition hover:bg-[#E4E4E4] active:scale-[0.96]"
            aria-label={`Меню: ${service.title}`}
          >
            <HiEllipsisHorizontal className="h-6 w-6" aria-hidden />
          </button>
        ) : null}
      </div>
    </li>
  );
}
