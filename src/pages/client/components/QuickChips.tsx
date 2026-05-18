type Chip = { id: string; label: string };

type Props = {
  chips: Chip[];
  activeIds: Set<string>;
  onToggle: (id: string) => void;
};

export function QuickChips({ chips, activeIds, onToggle }: Props) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chips.map((c) => {
        const on = activeIds.has(c.id);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onToggle(c.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition active:scale-[0.97] ${
              on
                ? 'bg-[#FFF1F4] text-[#F47C8C] shadow-[inset_0_0_0_1px_rgba(244,124,140,0.18)]'
                : 'bg-white text-[#6B7280] ring-1 ring-[#EAECEF]'
            }`}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
