import { useMemo, useState } from 'react';
import { HiChevronDown } from 'react-icons/hi2';
import {
  getServiceTemplatesForCategoryCode,
  type ServiceTemplate,
} from '../../constants/serviceTemplates';

type Variant = 'onboarding' | 'cabinet';

type Props = {
  categoryCode: string | null | undefined;
  categoryLabel?: string | null;
  selectedId?: string | null;
  onSelect: (template: ServiceTemplate) => void;
  variant?: Variant;
  className?: string;
  /** Кнопка с пунктирной обводкой — по нажатию показываются шаблоны категории. */
  collapsible?: boolean;
  /** Компактная строка «Показать / Скрыть» (кабинет). Без флага — панель с пунктиром (онбординг). */
  collapsibleCompact?: boolean;
};

function formatTemplateDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m} мин`;
  if (m <= 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}

function formatTemplatePrice(tm: ServiceTemplate): string {
  const prefix = tm.priceType === 'from' ? 'от ' : '';
  return `${prefix}${tm.price} BYN`;
}

function chipClass(active: boolean, variant: Variant): string {
  const base =
    'shrink-0 max-w-[min(100%,14rem)] rounded-full px-3.5 py-2 text-left text-[13px] font-semibold leading-snug transition active:scale-[0.98]';
  if (variant === 'cabinet') {
    return `${base} ${
      active ? 'bg-[#F47C8C] text-white' : 'bg-[#FFF1F4] text-[#111827] hover:bg-[#FFE4EA]'
    }`;
  }
  return `${base} ${
    active ? 'bg-[#E8BCBC] text-neutral-950' : 'bg-[#F5E0E0] text-neutral-900'
  }`;
}

const labelClass: Record<Variant, string> = {
  onboarding: 'text-[12px] font-semibold uppercase tracking-normal text-neutral-400',
  cabinet: 'text-[13px] font-medium text-[#6B7280]',
};

function TemplatesRow({
  templates,
  selectedId,
  onSelect,
  variant,
}: {
  templates: ServiceTemplate[];
  selectedId: string | null;
  onSelect: (template: ServiceTemplate) => void;
  variant: Variant;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {templates.map((tm) => (
        <button
          key={tm.id}
          type="button"
          onClick={() => onSelect(tm)}
          className={chipClass(selectedId === tm.id, variant)}
        >
          {tm.title}
        </button>
      ))}
    </div>
  );
}

function TemplatesList({
  templates,
  selectedId,
  onSelect,
}: {
  templates: ServiceTemplate[];
  selectedId: string | null;
  onSelect: (template: ServiceTemplate) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[12px] bg-white ring-1 ring-[#EEEEEE]">
      {templates.map((tm, index) => {
        const active = selectedId === tm.id;
        return (
          <button
            key={tm.id}
            type="button"
            onClick={() => onSelect(tm)}
            className={`flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left transition active:scale-[0.99] ${
              active ? 'bg-[#FFF1F4]' : 'hover:bg-[#FAFAFA]'
            } ${index > 0 ? 'border-t border-[#F3F4F6]' : ''}`}
          >
            <span
              className={`min-w-0 flex-1 text-[14px] font-semibold leading-snug ${
                active ? 'text-[#F47C8C]' : 'text-[#111827]'
              }`}
            >
              {tm.title}
            </span>
            <span className="shrink-0 text-[12px] font-medium tabular-nums text-[#6B7280]">
              {formatTemplateDuration(tm.durationMinutes)} · {formatTemplatePrice(tm)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Быстрый выбор шаблона услуги по категории мастера. */
export function PopularServiceTemplatesChips({
  categoryCode,
  categoryLabel,
  selectedId = null,
  onSelect,
  variant = 'onboarding',
  className = '',
  collapsible = false,
  collapsibleCompact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const templates = useMemo(
    () => getServiceTemplatesForCategoryCode(categoryCode ?? ''),
    [categoryCode],
  );
  const selectedTemplate = useMemo(
    () => templates.find((tm) => tm.id === selectedId) ?? null,
    [selectedId, templates],
  );

  if (!collapsible) {
    if (templates.length === 0) return null;

    const body =
      variant === 'cabinet' ? (
        <TemplatesList templates={templates} selectedId={selectedId} onSelect={onSelect} />
      ) : (
        <TemplatesRow
          templates={templates}
          selectedId={selectedId}
          onSelect={onSelect}
          variant={variant}
        />
      );

    return (
      <div className={className}>
        <p className={labelClass[variant]}>Популярные услуги</p>
        <div className="mt-2">{body}</div>
      </div>
    );
  }

  const hasCategory = Boolean(categoryCode?.trim());

  if (collapsibleCompact) {
    if (!hasCategory || templates.length === 0) return null;

    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-3 rounded-[10px] bg-[#F5F5F5] px-3.5 py-2.5 text-left transition hover:bg-[#EBEBEB] active:scale-[0.99]"
        >
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold text-[#111827]">
              {selectedTemplate && !open ? selectedTemplate.title : 'Шаблон из каталога'}
            </span>
            {!open ? (
              <span className="mt-0.5 block text-[12px] font-medium text-[#6B7280]">
                {selectedTemplate
                  ? `${formatTemplateDuration(selectedTemplate.durationMinutes)} · ${formatTemplatePrice(selectedTemplate)}`
                  : 'Быстро заполнить название, цену и длительность'}
              </span>
            ) : null}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[#F47C8C]">
            {open ? 'Скрыть' : 'Выбрать'}
            <HiChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </span>
        </button>

        {open ? (
          <div className="mt-2.5">
            <TemplatesList
              templates={templates}
              selectedId={selectedId}
              onSelect={(tm) => {
                onSelect(tm);
                setOpen(false);
              }}
            />
          </div>
        ) : null}
      </div>
    );
  }

  const hasCategoryOnboarding = hasCategory;
  const countLabel = !hasCategoryOnboarding
    ? 'Сначала выберите категорию на шаге 2'
    : templates.length === 0
      ? 'Нет шаблонов для этой категории'
      : `${templates.length} ${
          templates.length === 1 ? 'вариант' : templates.length < 5 ? 'варианта' : 'вариантов'
        }`;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-[12px] border-2 border-dashed border-[#E29595]/55 bg-[#FFF9FB] px-4 py-3.5 text-left transition hover:border-[#F47C8C]/75 hover:bg-[#FFF1F4] active:scale-[0.99]"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold leading-snug text-[#111827]">
            Популярные услуги под твою категорию
          </span>
          <span className="mt-0.5 block truncate text-[12px] font-medium text-[#6B7280]">
            {categoryLabel?.trim() ? categoryLabel.trim() : 'Выберите категорию на шаге 2'}
            <span className="text-[#9CA3AF]"> · {countLabel}</span>
          </span>
        </span>
        <HiChevronDown
          className={`h-5 w-5 shrink-0 text-[#E29595] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="mt-3 rounded-[12px] border-2 border-dashed border-[#EAECEF] bg-white p-3 sm:p-4">
          {!hasCategoryOnboarding ? (
            <p className="text-[13px] font-medium leading-snug text-[#6B7280]">
              Вернитесь на шаг «Категория» и выберите направление — здесь появятся популярные услуги.
            </p>
          ) : templates.length === 0 ? (
            <p className="text-[13px] font-medium leading-snug text-[#6B7280]">
              Для этой категории нет готовых шаблонов — заполните услугу вручную ниже.
            </p>
          ) : (
            <TemplatesRow
              templates={templates}
              selectedId={selectedId}
              onSelect={(tm) => {
                onSelect(tm);
                setOpen(false);
              }}
              variant={variant}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
