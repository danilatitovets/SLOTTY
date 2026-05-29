import type { ReactNode } from 'react';
import { CertificateDocumentThumb } from './CertificateDocumentThumb';
import {
  formatCertificateDisplayTitle,
  resolveCertificateOrganizationAndYear,
} from './certificateDisplay';

export type CertificatePreviewItem = {
  id: string;
  title: string;
  organization?: string;
  year?: string;
  imageUrl?: string | null;
};

type Props = {
  certificate: CertificatePreviewItem;
  loading?: 'eager' | 'lazy';
  onImageClick?: () => void;
  headerSlot?: ReactNode;
};

export function CertificatePreviewCard({
  certificate,
  loading = 'lazy',
  onImageClick,
  headerSlot,
}: Props) {
  const title = formatCertificateDisplayTitle(certificate.title);
  const { organization, year } = resolveCertificateOrganizationAndYear(
    certificate.organization,
    certificate.year,
  );
  const imageUrl = certificate.imageUrl?.trim();
  const canZoom = Boolean(onImageClick && imageUrl);

  const thumb = (
    <CertificateDocumentThumb
      src={certificate.imageUrl}
      alt={title}
      variant="card"
      loading={loading}
      className="rounded-[14px] bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]"
    />
  );

  return (
    <article className="flex w-[min(72vw,11.75rem)] shrink-0 snap-start flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_2px_14px_rgba(17,24,39,0.07)] ring-1 ring-[#EAECEF]">
      <div className="relative bg-gradient-to-b from-[#FAFBFC] to-[#F0F2F5] p-2.5">
        {headerSlot ? <div className="absolute right-3 top-3 z-20">{headerSlot}</div> : null}
        {canZoom ? (
          <button
            type="button"
            onClick={onImageClick}
            className="block w-full cursor-zoom-in rounded-[14px] text-left transition active:opacity-90"
            aria-label={`Увеличить: ${title}`}
          >
            {thumb}
          </button>
        ) : (
          thumb
        )}
      </div>
      <div className="border-t border-[#F3F4F6] px-3 py-2.5">
        <p className="line-clamp-2 text-[13px] font-semibold leading-snug tracking-[-0.01em] text-[#111827]">
          {title}
        </p>
        {organization ? (
          <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-snug text-[#6B7280]">
            {organization}
          </p>
        ) : null}
        {year ? (
          <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-[#9CA3AF]">{year}</p>
        ) : null}
      </div>
    </article>
  );
}
