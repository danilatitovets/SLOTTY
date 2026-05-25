import { useMemo, useState } from 'react';
import { HiMagnifyingGlass } from 'react-icons/hi2';
import { catalogSheetField } from '../shared/adminCatalogSheetTheme';
import type { WindowTemplate } from './scheduleTypes';
import { templateDisplayLabel } from './scheduleUtils';
import { WindowTemplateCard } from './WindowTemplateCard';

type Props = {
  templates: WindowTemplate[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/** Компактный выбор шаблона внутри шита «Новое окно». */
export function AddWindowTemplatePicker({ templates, selectedId, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const showSearch = templates.length > 4;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((t) => {
      const haystack = `${templateDisplayLabel(t)} ${t.serviceName}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query, templates]);

  if (templates.length === 0) {
    return (
      <p className="rounded-[10px] bg-[#EBEBEB] px-4 py-3 text-[14px] font-medium text-[#6B7280]">
        Нет шаблонов — создайте вручную или добавьте шаблон на вкладке «Создать».
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {showSearch ? (
        <label className="relative block">
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

      {filtered.length === 0 ? (
        <p className="text-[13px] font-semibold text-[#6B7280]">Ничего не найдено</p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5" role="list" aria-label="Шаблоны">
          {filtered.map((t) => (
            <WindowTemplateCard
              key={t.id}
              template={t}
              selected={selectedId === t.id}
              onSelect={() => onSelect(t.id)}
              hideMenu
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}
