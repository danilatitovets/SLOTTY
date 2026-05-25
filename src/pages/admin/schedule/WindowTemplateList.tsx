import { useMemo, useState } from 'react';
import { HiMagnifyingGlass, HiPlus } from 'react-icons/hi2';
import { catalogSheetField } from '../shared/adminCatalogSheetTheme';
import {
  scheduleTemplateAddBtn,
  scheduleTemplateCellWrap,
  scheduleTemplatesGridFull,
  scheduleTemplatesTray,
} from './adminScheduleTheme';
import type { WindowTemplate } from './scheduleTypes';
import { templateDisplayLabel } from './scheduleUtils';
import { WindowTemplateCard } from './WindowTemplateCard';

const SEARCH_THRESHOLD = 5;

type Props = {
  templates: WindowTemplate[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpenMenu: (template: WindowTemplate) => void;
  onCreate: () => void;
  fullWidth?: boolean;
};

export function WindowTemplateList({
  templates,
  selectedId,
  onSelect,
  onOpenMenu,
  onCreate,
  fullWidth = false,
}: Props) {
  const [query, setQuery] = useState('');
  const showSearch = templates.length > SEARCH_THRESHOLD;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((t) => {
      const haystack = `${templateDisplayLabel(t)} ${t.serviceName}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query, templates]);

  const countLabel =
    templates.length === 1 ? '1 шаблон' : `${templates.length} ${templates.length < 5 ? 'шаблона' : 'шаблонов'}`;

  const gridClass = fullWidth
    ? scheduleTemplatesGridFull
    : 'grid w-full grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-2 lg:gap-4 xl:grid-cols-3';

  const cellWrapClass = fullWidth ? scheduleTemplateCellWrap : 'w-full min-w-0';

  return (
    <section className="w-full min-w-0 space-y-4 lg:space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 lg:gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-bold tracking-[-0.03em] text-[#111827] lg:text-[22px] lg:tracking-[-0.05em]">
            Шаблоны окон
          </h3>
          <p className="mt-1 text-[13px] font-medium leading-relaxed text-[#6B7280] lg:hidden">
            Тап по шаблону — сразу форма окна
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {templates.length > 0 ? (
            <span className="rounded-full bg-[#EBEBEB] px-3 py-1.5 text-[12px] font-semibold text-[#6B7280] lg:bg-[#F6F7FB] lg:ring-1 lg:ring-[#EEEEEE]">
              {countLabel}
            </span>
          ) : null}
          <button
            type="button"
            onClick={onCreate}
            className="hidden items-center gap-2 rounded-[10px] bg-[#F47C8C] px-4 py-2.5 text-[14px] font-semibold text-white transition hover:opacity-95 active:scale-[0.98] lg:inline-flex"
          >
            <HiPlus className="h-5 w-5" aria-hidden />
            Новый шаблон
          </button>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="w-full rounded-[16px] bg-white px-4 py-8 text-center ring-1 ring-[#EEEEEE] lg:rounded-[22px] lg:py-12 lg:ring-[#EAECEF]">
          <p className="text-[14px] font-medium text-[#6B7280]">
            Шаблонов пока нет — создайте первый для частой услуги
          </p>
          <button
            type="button"
            onClick={onCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-[#F47C8C] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:opacity-95 active:scale-[0.98]"
          >
            <HiPlus className="h-5 w-5" aria-hidden />
            Создать шаблон
          </button>
        </div>
      ) : null}

      {templates.length > 0 ? (
        <div className="w-full min-w-0 space-y-3 lg:space-y-4">
          {showSearch ? (
            <label className="relative block w-full max-w-md">
              <HiMagnifyingGlass
                className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF]"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Найти шаблон…"
                className={`${catalogSheetField} pl-11`}
              />
            </label>
          ) : null}

          <div className="w-full min-w-0" role="list" aria-label="Шаблоны окон">
            {filtered.length === 0 ? (
              <p className="rounded-[10px] bg-[#EBEBEB] px-4 py-3 text-[13px] font-medium text-[#6B7280] lg:bg-white lg:ring-1 lg:ring-[#EEEEEE]">
                Ничего не найдено
              </p>
            ) : (
              <div
                className={`w-full min-w-0 ${scheduleTemplatesTray} max-lg:bg-transparent max-lg:p-0 max-lg:ring-0`}
              >
                <div className={gridClass}>
                  {filtered.map((t) => (
                    <div key={t.id} className={cellWrapClass}>
                      <WindowTemplateCard
                        template={t}
                        selected={selectedId === t.id}
                        onSelect={() => onSelect(t.id)}
                        onOpenMenu={() => onOpenMenu(t)}
                      />
                    </div>
                  ))}
                  <button type="button" onClick={onCreate} className={scheduleTemplateAddBtn}>
                    <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white text-[#6B7280] ring-1 ring-[#EEEEEE] lg:h-10 lg:w-10 lg:rounded-[12px] lg:bg-[#FFF1F4] lg:text-[#F47C8C] lg:ring-0">
                      <HiPlus className="h-5 w-5" aria-hidden />
                    </span>
                    <span>Шаблон</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
