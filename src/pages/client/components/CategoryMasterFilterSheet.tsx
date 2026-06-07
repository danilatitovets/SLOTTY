import { FilterChipGroup, FilterSheet, FilterSwitch } from './FilterSheet';
import { ServiceCategoryRail } from './ServiceCategoryRail';
import type { CategoryMasterFilters } from '../lib/categoryMasterFilters';
import { DEFAULT_CATEGORY_MASTER_FILTERS } from '../lib/categoryMasterFilters';

type CategoryOption = { code: string; name: string };

type Props = {
  open: boolean;
  title: string;
  draft: CategoryMasterFilters;
  onChange: (next: CategoryMasterFilters) => void;
  onClose: () => void;
  onApply: () => void;
  /** Список категорий — только для каталога мастеров. */
  serviceCategories?: CategoryOption[];
};

export function CategoryMasterFilterSheet({
  open,
  title,
  draft,
  onChange,
  onClose,
  onApply,
  serviceCategories,
}: Props) {
  const patch = (partial: Partial<CategoryMasterFilters>) => onChange({ ...draft, ...partial });

  return (
    <FilterSheet
      open={open}
      title={title}
      onClose={onClose}
      onReset={() => onChange({ ...DEFAULT_CATEGORY_MASTER_FILTERS })}
      onApply={onApply}
    >
      {serviceCategories && serviceCategories.length > 0 ? (
        <div className="mb-5">
          <p className="mb-2.5 text-[13px] font-medium text-[#8E8E93]">Категория</p>
          <ServiceCategoryRail
            categories={serviceCategories}
            activeCode={draft.categoryCode}
            showAllLink
            onSelectCategory={(code) => patch({ categoryCode: code })}
          />
        </div>
      ) : null}

      <FilterChipGroup
        label="Когда"
        options={[
          { id: 'any', label: 'Любая дата' },
          { id: 'today', label: 'Сегодня' },
          { id: 'tomorrow', label: 'Завтра' },
          { id: 'week', label: 'На неделе' },
          { id: 'weekend', label: 'В выходные' },
        ]}
        value={draft.dateRange}
        onChange={(id) => patch({ dateRange: (id ?? 'any') as CategoryMasterFilters['dateRange'] })}
      />

      <FilterChipGroup
        label="Время дня"
        options={[
          { id: 'any', label: 'Любое' },
          { id: 'morning', label: 'Утро' },
          { id: 'afternoon', label: 'День' },
          { id: 'evening', label: 'Вечер' },
        ]}
        value={draft.timeOfDay}
        onChange={(id) => patch({ timeOfDay: (id ?? 'any') as CategoryMasterFilters['timeOfDay'] })}
      />

      <FilterChipGroup
        label="Формат"
        options={[
          { id: 'any', label: 'Любой' },
          { id: 'studio', label: 'В студии' },
          { id: 'at_home', label: 'На дому' },
        ]}
        value={draft.visitType}
        onChange={(id) => patch({ visitType: (id ?? 'any') as CategoryMasterFilters['visitType'] })}
      />

      <FilterChipGroup
        label="Рейтинг"
        options={[
          { id: 'none', label: 'Любой' },
          { id: '45', label: 'от 4.5' },
          { id: '48', label: 'от 4.8' },
          { id: '49', label: 'от 4.9' },
        ]}
        value={draft.minRating ?? 'none'}
        onChange={(id) =>
          patch({
            minRating: id === 'none' || !id ? null : (id as CategoryMasterFilters['minRating']),
            sortBy:
              id && id !== 'none'
                ? 'rating'
                : draft.sortBy === 'rating'
                  ? 'recommended'
                  : draft.sortBy,
          })
        }
      />

      <FilterChipGroup
        label="Отзывы"
        options={[
          { id: 'none', label: 'Любое' },
          { id: '5', label: 'от 5' },
          { id: '20', label: 'от 20' },
          { id: '50', label: 'от 50' },
        ]}
        value={draft.minReviews ?? 'none'}
        onChange={(id) =>
          patch({
            minReviews: id === 'none' || !id ? null : (id as CategoryMasterFilters['minReviews']),
          })
        }
      />

      <FilterChipGroup
        label="Цена"
        options={[
          { id: 'none', label: 'Любая' },
          { id: 'under30', label: 'до 30 BYN' },
          { id: '30_50', label: '30–50 BYN' },
          { id: '50_100', label: '50–100 BYN' },
          { id: 'over100', label: 'от 100 BYN' },
        ]}
        value={draft.priceTier ?? 'none'}
        onChange={(id) =>
          patch({
            priceTier: id === 'none' || !id ? null : (id as CategoryMasterFilters['priceTier']),
          })
        }
      />

      <FilterChipGroup
        label="Длительность"
        options={[
          { id: 'any', label: 'Любая' },
          { id: 'under30', label: 'до 30 мин' },
          { id: '30_60', label: '30–60 мин' },
          { id: '60_120', label: '1–2 часа' },
          { id: 'over120', label: 'больше 2 ч' },
        ]}
        value={draft.duration}
        onChange={(id) => patch({ duration: (id ?? 'any') as CategoryMasterFilters['duration'] })}
      />

      <FilterChipGroup
        label="Сортировка"
        options={[
          { id: 'recommended', label: 'Рекомендуем' },
          { id: 'soonest', label: 'Ближайшее окно' },
          { id: 'rating', label: 'По рейтингу' },
          { id: 'reviews', label: 'По отзывам' },
          { id: 'price_asc', label: 'Дешевле' },
          { id: 'price_desc', label: 'Дороже' },
        ]}
        value={draft.sortBy}
        onChange={(id) =>
          patch({
            sortBy: (id ?? 'recommended') as CategoryMasterFilters['sortBy'],
          })
        }
      />

      <FilterSwitch
        label="Только со свободными окнами"
        checked={draft.onlyWithSlots}
        onChange={(onlyWithSlots) => patch({ onlyWithSlots })}
      />
      <FilterSwitch
        label="Только с акциями"
        checked={draft.promotionOnly}
        onChange={(promotionOnly) => patch({ promotionOnly })}
      />
      <FilterSwitch
        label="Проверенные мастера"
        checked={draft.verifiedOnly}
        onChange={(verifiedOnly) => patch({ verifiedOnly })}
      />
    </FilterSheet>
  );
}
