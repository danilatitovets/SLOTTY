import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { MASTER_SETTINGS_SUPPORT_DOCS_PATH, MASTER_SETTINGS_SUPPORT_PATH } from '../../../../../app/paths';
import {
  legalDocLinkClass,
  legalDocProseClass,
  LegalDocSection,
  LegalDocTocNav,
  shouldShowLegalDocToc,
} from '../../../../legal/legalDocumentUi';
import { useLegalTocActiveId } from '../../../../legal/useLegalTocActiveId';
import { settingsCabinetOutlineBtn, settingsCabinetPrimaryBtn } from '../settingsCabinetUi';
import { getSupportGuide } from './supportGuideContent';

export function SupportGuidePage() {
  const { guideId = '' } = useParams<{ guideId: string }>();
  const guide = getSupportGuide(guideId);
  const toc = guide?.sections.map((s) => ({ id: s.id, label: s.title })) ?? [];
  const showToc = shouldShowLegalDocToc(toc.length);
  const activeSectionId = useLegalTocActiveId(showToc ? toc.map((t) => t.id) : []);

  useEffect(() => {
    const main = document.querySelector<HTMLElement>('main.overflow-y-auto');
    if (main) main.scrollTo(0, 0);
    else window.scrollTo(0, 0);
  }, [guideId]);

  if (!guide) {
    return <Navigate to={MASTER_SETTINGS_SUPPORT_DOCS_PATH} replace />;
  }

  if (guide.docsLinkPath) {
    return <Navigate to={guide.docsLinkPath} replace />;
  }

  return (
    <div className="min-w-0">
      <header className="mb-6 min-w-0 border-b border-[#F0F1F5] pb-6">
        <nav className="text-[14px] font-normal text-[#9CA3AF]" aria-label="Хлебные крошки">
          <Link to={MASTER_SETTINGS_SUPPORT_PATH} className="transition hover:text-[#374151]">
            Центр поддержки
          </Link>
          <span className="mx-1.5 text-[#D1D5DB]" aria-hidden>
            /
          </span>
          <Link to={MASTER_SETTINGS_SUPPORT_DOCS_PATH} className="transition hover:text-[#374151]">
            Документация
          </Link>
          <span className="mx-1.5 text-[#D1D5DB]" aria-hidden>
            /
          </span>
          <span className="text-[#6B7280]">{guide.title}</span>
        </nav>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 max-w-[720px]">
            <h1 className="text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#111827] sm:text-[36px]">
              {guide.title}
            </h1>
            <p className={`mt-2 max-w-[640px] ${legalDocProseClass} text-[#6B7280]`}>{guide.intro}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link to={guide.openPath} className={settingsCabinetPrimaryBtn}>
              Открыть раздел
            </Link>
            <Link to={MASTER_SETTINGS_SUPPORT_DOCS_PATH} className={settingsCabinetOutlineBtn}>
              Назад
            </Link>
          </div>
        </div>
      </header>

      <div className={showToc ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-16 xl:gap-20' : ''}>
        <article className={`min-w-0 space-y-8 ${showToc ? 'max-w-[720px]' : 'max-w-[800px]'}`}>
          {showToc ? (
            <LegalDocTocNav
              items={toc}
              activeId={activeSectionId}
              className="border-b border-[#F0F1F5] pb-6 lg:hidden"
            />
          ) : null}

          {guide.sections.map((section) => (
            <LegalDocSection key={section.id} id={section.id} title={section.title}>
              {section.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </LegalDocSection>
          ))}

          <p className={`border-t border-[#F0F1F5] pt-6 ${legalDocProseClass} text-[#6B7280]`}>
            Готовы настроить в кабинете?{' '}
            <Link to={guide.openPath} className={legalDocLinkClass}>
              Перейти в «{guide.title}»
            </Link>
            .
          </p>
        </article>

        {showToc ? (
          <aside className="hidden lg:block">
            <LegalDocTocNav items={toc} activeId={activeSectionId} className="sticky top-24" />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
