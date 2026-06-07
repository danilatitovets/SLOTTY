import type { ServiceCategoryDto } from '../../../features/master-onboarding/api/becomeMasterApi';
import {
  DEFAULT_CATEGORY_MASTER_FILTERS,
  type CategoryMasterFilters,
} from '../lib/categoryMasterFilters';
import { CatalogFilterSheet } from '../servicesCatalog/CatalogFilterSheet';
import { MastersCatalogFiltersPanel } from './MastersCatalogFiltersPanel';

type Props = {
  open: boolean;
  draft: CategoryMasterFilters;
  resultCount: number;
  categories: ServiceCategoryDto[];
  onChange: (next: CategoryMasterFilters) => void;
  onClose: () => void;
  onApply: () => void;
};

export function MastersCatalogFiltersSheet({
  open,
  draft,
  resultCount,
  categories,
  onChange,
  onClose,
  onApply,
}: Props) {
  return (
    <CatalogFilterSheet
      open={open}
      title="Фильтры"
      resultCount={resultCount}
      resultNoun="мастеров"
      onClose={onClose}
      onReset={() => onChange({ ...DEFAULT_CATEGORY_MASTER_FILTERS })}
      onApply={onApply}
    >
      <MastersCatalogFiltersPanel
        filters={draft}
        onChange={onChange}
        categories={categories}
      />
    </CatalogFilterSheet>
  );
}
