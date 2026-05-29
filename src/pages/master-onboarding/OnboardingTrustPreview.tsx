import { useMemo, useState } from 'react';
import { PortfolioImagePreview } from '../client/masterProfile/PortfolioImagePreview';
import { CertificatePreviewCard } from './CertificatePreviewCard';
import {
  formatEducationPeriod,
  sortEducationItemsChronologically,
  type OnboardingEducationItem,
} from './onboardingEducation';
import type { MasterCertificate } from '../../features/master-onboarding/model/masterCertificate';
import { catalogCanvasClass } from '../client/masterProfile/masterProfileTheme';

type Props = {
  certificates: MasterCertificate[];
  educationItems: OnboardingEducationItem[];
};

function certsCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? 'сертификат'
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? 'сертификата'
        : 'сертификатов';
  return `${count} ${word}`;
}

function TrustSectionHeader({ title, countLabel }: { title: string; countLabel: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#111827]">{title}</h2>
      <span className="shrink-0 rounded-full bg-[#FFF1F4] px-2.5 py-1 text-[11px] font-semibold tabular-nums text-[#F47C8C]">
        {countLabel}
      </span>
    </div>
  );
}

export function OnboardingTrustPreview({ certificates, educationItems }: Props) {
  const [certPreviewIndex, setCertPreviewIndex] = useState<number | null>(null);

  const certImageUrls = useMemo(
    () =>
      certificates
        .map((c) => c.imageUrl?.trim())
        .filter((url): url is string => Boolean(url)),
    [certificates],
  );

  const education = useMemo(
    () =>
      sortEducationItemsChronologically(
        educationItems.filter((e) => e.title.trim().length >= 2),
      ),
    [educationItems],
  );
  const hasContent = certificates.length > 0 || education.length > 0;

  return (
    <div
      className={`overflow-hidden rounded-[16px] ring-1 ring-[#EAECEF] ${catalogCanvasClass}`}
      aria-label="Превью блока доверия"
    >
      <div className="pointer-events-none space-y-6 p-4 sm:p-5">
        {!hasContent ? (
          <p className="rounded-[12px] bg-[#FAFAFA] px-4 py-8 text-center text-[14px] font-medium leading-snug text-[#6B7280]">
            Добавьте сертификаты или образование — здесь покажем, как увидят клиенты
          </p>
        ) : null}

        {certificates.length > 0 ? (
          <section>
            <TrustSectionHeader
              title="Сертификаты"
              countLabel={certsCountLabel(certificates.length)}
            />
            <div className="pointer-events-auto mt-4 -mx-0.5 flex gap-3 overflow-x-auto pb-1 pl-0.5 pr-0.5 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {certificates.map((certificate, i) => {
                const imageUrl = certificate.imageUrl?.trim();
                return (
                  <CertificatePreviewCard
                    key={certificate.id}
                    certificate={{
                      id: certificate.id,
                      title: certificate.title,
                      organization: certificate.organization,
                      year: certificate.year,
                      imageUrl: certificate.imageUrl,
                    }}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    onImageClick={
                      imageUrl
                        ? () => {
                            const index = certImageUrls.indexOf(imageUrl);
                            setCertPreviewIndex(index >= 0 ? index : 0);
                          }
                        : undefined
                    }
                  />
                );
              })}
            </div>
            {certPreviewIndex != null && certImageUrls.length > 0 ? (
              <PortfolioImagePreview
                urls={certImageUrls}
                index={certPreviewIndex}
                singleLabel="Сертификат"
                onClose={() => setCertPreviewIndex(null)}
                onIndexChange={setCertPreviewIndex}
              />
            ) : null}
          </section>
        ) : null}

        {education.length > 0 ? (
          <section>
            <TrustSectionHeader
              title="Образование"
              countLabel={
                education.length === 1
                  ? '1 запись'
                  : education.length < 5
                    ? `${education.length} записи`
                    : `${education.length} записей`
              }
            />
            <ul className="relative mt-4 space-y-0">
              {education.map((item, index) => {
                const period = formatEducationPeriod(item.startYear, item.endYear);
                const meta = [item.place.trim(), period].filter(Boolean).join(' · ');
                const isLast = index === education.length - 1;
                return (
                  <li key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
                    {!isLast ? (
                      <span
                        className="absolute left-[15px] top-9 bottom-0 w-px bg-[#FDE8ED]"
                        aria-hidden
                      />
                    ) : null}
                    <span
                      className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[11px] font-bold text-[#F47C8C] ring-4 ring-white"
                      aria-hidden
                    >
                      У
                    </span>
                    <div className="min-w-0 flex-1 rounded-[14px] bg-[#FAFAFA] p-3 ring-1 ring-[#EEEEEE]">
                      <p className="text-[14px] font-semibold leading-snug text-[#111827]">{item.title}</p>
                      {meta ? (
                        <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">{meta}</p>
                      ) : null}
                      {item.description?.trim() ? (
                        <p className="mt-1.5 line-clamp-3 text-[12px] leading-relaxed text-[#6B7280]">
                          {item.description.trim()}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
