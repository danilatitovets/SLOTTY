import type { ReactNode } from 'react';
import { paCard, paFilterChip, paInput } from '../platformAdminTheme';

type FilterGroup = {
  label: string;
  chips: Array<{ id: string; label: string; active: boolean; onClick: () => void }>;
};

type Props = {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
  };
  filterGroups?: FilterGroup[];
  trailing?: ReactNode;
  resultCount?: number;
};

export function PlatformAdminToolbar({ search, filterGroups, trailing, resultCount }: Props) {
  return (
    <div className={`${paCard} mb-5 space-y-4 p-4 sm:p-5`}>
      {search ? (
        <input
          className={paInput}
          placeholder={search.placeholder}
          value={search.value}
          onChange={(e) => search.onChange(e.target.value)}
        />
      ) : null}

      {filterGroups?.map((group) => (
        <div key={group.label}>
          <p className="text-[12px] font-bold uppercase tracking-wide text-[#9CA3AF]">{group.label}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {group.chips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                className={paFilterChip(chip.active)}
                onClick={chip.onClick}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      {trailing}

      {resultCount !== undefined ? (
        <p className="text-[13px] font-medium text-[#6B7280]">
          Найдено: <span className="font-bold text-[#111827]">{resultCount}</span>
        </p>
      ) : null}
    </div>
  );
}
