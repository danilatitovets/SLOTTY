import { resolveAdminSectionMeta } from '../adminCabinetNav';

type Props = {
  pathname: string;
  variant?: 'desktop' | 'mobile' | 'compact';
  className?: string;
};

/** Краткое описание раздела — чтобы было понятно, зачем он нужен. */
export function AdminCabinetSectionIntro({
  pathname,
  variant = 'desktop',
  className = '',
}: Props) {
  const meta = resolveAdminSectionMeta(pathname);
  if (!meta?.description) return null;

  if (variant === 'compact') {
    return (
      <p className={`text-[13px] leading-relaxed text-[#6B7280] ${className}`.trim()}>
        {meta.description}
      </p>
    );
  }

  if (variant === 'mobile') {
    return (
      <div className={`rounded-[12px] bg-white px-3.5 py-3 ring-1 ring-[#F0F0F0] ${className}`.trim()}>
        <p className="text-[13px] font-semibold text-[#111827]">{meta.title}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-[#6B7280]">{meta.description}</p>
      </div>
    );
  }

  return (
    <p className={`mt-1 max-w-2xl text-[14px] leading-relaxed text-[#6B7280] ${className}`.trim()}>
      {meta.description}
    </p>
  );
}
