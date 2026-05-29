import { ImageReveal } from '../../shared/ui/ImageReveal';

const frameCard =
  'flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[12px] bg-[#FAFAFA] p-2.5 ring-1 ring-[#E5E7EB]/90';

const frameRow =
  'flex h-[4.25rem] w-[5.25rem] shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#FAFAFA] p-1.5 ring-1 ring-[#E5E7EB]/90';

const imgClass = 'max-h-full max-w-full object-contain object-center';

type Props = {
  src?: string | null;
  alt?: string;
  variant?: 'card' | 'row';
  loading?: 'eager' | 'lazy';
  className?: string;
};

export function CertificateDocumentThumb({
  src,
  alt = '',
  variant = 'card',
  loading = 'lazy',
  className = '',
}: Props) {
  const frameClass = `${variant === 'row' ? frameRow : frameCard}${className ? ` ${className}` : ''}`;
  const url = src?.trim();

  return (
    <div className={frameClass}>
      {url ? (
        <ImageReveal src={url} alt={alt} className={imgClass} loading={loading} />
      ) : (
        <span className="text-[10px] font-medium text-[#9CA3AF]">Документ</span>
      )}
    </div>
  );
}
