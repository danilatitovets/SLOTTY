import { CatalogFilterSheet } from './CatalogFilterSheet';
import {
  resetCatalogFilters,
  type CatalogFiltersState,
} from './catalogFiltersState';
import { ServicesCatalogFiltersPanel } from './ServicesCatalogFiltersPanel';

type Props = {
  open: boolean;
  draft: CatalogFiltersState;
  resultCount: number;
  onChange: (next: CatalogFiltersState) => void;
  onClose: () => void;
  onApply: () => void;
};

export function ServicesCatalogFiltersSheet({
  open,
  draft,
  resultCount,
  onChange,
  onClose,
  onApply,
}: Props) {
  return (
    <CatalogFilterSheet
      open={open}
      title="Фильтры"
      resultCount={resultCount}
      resultNoun="вариантов"
      onClose={onClose}
      onReset={() => onChange(resetCatalogFilters())}
      onApply={onApply}
    >
      <ServicesCatalogFiltersPanel filters={draft} onChange={onChange} layout="sheet" />
    </CatalogFilterSheet>
  );
}
