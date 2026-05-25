export const paCard =
  'rounded-2xl border border-[#eef0f5] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]';

export const paCanvas = 'min-h-dvh bg-[#f6f7fb]';

export const paPrimaryBtn =
  'inline-flex h-11 items-center justify-center rounded-2xl bg-[#ff5f7a] px-5 text-[14px] font-semibold text-white transition hover:bg-[#f94f6c] active:scale-[0.98] disabled:opacity-50';

export const paGhostBtn =
  'inline-flex h-11 items-center justify-center rounded-2xl border border-[#e5e7eb] bg-white px-5 text-[14px] font-semibold text-[#374151] transition hover:bg-[#f9fafb] active:scale-[0.98]';

export const paDangerBtn =
  'inline-flex h-11 items-center justify-center rounded-2xl bg-[#ef4444] px-5 text-[14px] font-semibold text-white transition hover:bg-[#dc2626] active:scale-[0.98] disabled:opacity-50';

export const paInput =
  'w-full rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 text-[15px] text-[#111827] outline-none transition focus:border-[#ff5f7a]/50 focus:ring-2 focus:ring-[#ff5f7a]/20';

export const paFilterChip = (active: boolean) =>
  `rounded-full px-3.5 py-2 text-[13px] font-semibold transition ${
    active
      ? 'bg-[#ff5f7a] text-white'
      : 'bg-white text-[#6B7280] border border-[#e5e7eb] hover:border-[#ff5f7a]/30'
  }`;
