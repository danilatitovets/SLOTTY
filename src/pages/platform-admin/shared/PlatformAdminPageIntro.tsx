import { useLocation } from 'react-router-dom';
import { getPlatformAdminPageMeta } from '../platformAdminNav';

export function PlatformAdminPageIntro() {
  const { pathname } = useLocation();
  const meta = getPlatformAdminPageMeta(pathname);
  if (!meta) return null;

  return (
    <header className="mb-6 max-w-3xl">
      <h1 className="text-[22px] font-bold tracking-tight text-[#111827] lg:text-[24px]">{meta.title}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-[#6B7280]">{meta.description}</p>
    </header>
  );
}
