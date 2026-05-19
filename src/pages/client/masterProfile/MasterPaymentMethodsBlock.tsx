type Props = {
  methods: string[];
  note?: string;
  compact?: boolean;
};

export function MasterPaymentMethodsBlock({ methods, note, compact = false }: Props) {
  const list = methods.filter((m) => m.trim());
  const noteText = note?.trim() ?? '';
  if (!list.length && !noteText) return null;

  return (
    <div className={compact ? 'mt-3' : undefined}>
      {list.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {list.map((method) => (
            <span
              key={method}
              className="inline-flex items-center rounded-full bg-[#FFF1F4] px-3 py-1.5 text-[13px] font-semibold text-[#111827] ring-1 ring-[#FDE8ED]"
            >
              {method}
            </span>
          ))}
        </div>
      ) : null}
      {noteText ? (
        <p
          className={`whitespace-pre-wrap text-[14px] leading-relaxed text-[#4B5563] ${
            list.length ? 'mt-2.5' : ''
          }`}
        >
          {noteText}
        </p>
      ) : null}
    </div>
  );
}
