type Chip = { id: string; label: string };

type Props = {
  chips: Chip[];
  activeIds: Set<string>;
  onToggle: (id: string) => void;
};

export function QuickChips({ chips, activeIds, onToggle }: Props) {
  return (
    <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chips.map((c) => {
        const on = activeIds.has(c.id);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onToggle(c.id)}
            className={`shrink-0 rounded-full border-0 px-4 py-2.5 text-[13px] font-semibold leading-none transition active:scale-[0.97] ${
              on
                ? 'bg-[#FFF1F4] text-[#F47C8C]'
                : 'bg-[#F1EFEF] text-[#6B7280]'
            }`}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
