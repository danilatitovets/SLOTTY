import { useState } from 'react';
import { HiChevronRight, HiPhoto } from 'react-icons/hi2';
import { PortfolioImagePreview } from '../../client/masterProfile/PortfolioImagePreview';
import { apptDetailSectionLabel, apptDetailSurfaceCard } from './adminAppointmentsTheme';

type Props = {
  photoUrl: string;
};

export function MasterAppointmentReferencePhotoBlock({ photoUrl }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className={`${apptDetailSurfaceCard} w-full px-4 py-4 text-left transition hover:bg-[#FAFAFA] active:scale-[0.995] sm:px-5 sm:py-4`}
      >
        <p className={apptDetailSectionLabel}>Фото-референс</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[14px] bg-[#FFF1F4] ring-2 ring-white">
            <img
              src={photoUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-[#111827]">Изображение от клиента</p>
            <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">Нажмите, чтобы открыть</p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[#F47C8C]">
            <HiPhoto className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <HiChevronRight className="h-5 w-5 shrink-0 text-[#D1D5DB]" aria-hidden />
        </div>
      </button>

      {previewOpen ? (
        <PortfolioImagePreview
          urls={[photoUrl]}
          index={0}
          onClose={() => setPreviewOpen(false)}
          onIndexChange={() => undefined}
          singleLabel="Фото-референс"
        />
      ) : null}
    </>
  );
}
