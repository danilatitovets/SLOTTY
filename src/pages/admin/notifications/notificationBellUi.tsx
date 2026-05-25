type BellVariant = 'mobile' | 'desktop';

export function NotificationBellBadge({ count, ringClass = 'ring-white' }: { count: number; ringClass?: string }) {
  if (count <= 0) return null;
  const label = count > 9 ? '9+' : String(count);

  return (
    <span
      className={`absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] animate-pulse items-center justify-center rounded-full bg-[#ff5f7a] px-1 text-[10px] font-bold leading-none text-white shadow-[0_0_10px_rgba(255,95,122,0.55)] ring-2 ${ringClass}`}
      aria-hidden
    >
      {label}
    </span>
  );
}

export function notificationBellLinkClass(
  isActive: boolean,
  hasUnread: boolean,
  variant: BellVariant = 'mobile',
): string {
  const base =
    'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition active:scale-[0.97]';

  if (isActive) {
    return `${base} bg-[#FFF1F4] text-[#ff5f7a] ring-1 ring-[#FDE8ED]`;
  }

  if (hasUnread) {
  return `${base} bg-[#FFF1F4] text-[#ff5f7a] shadow-[0_0_0_2px_rgba(255,95,122,0.16),0_0_18px_rgba(255,95,122,0.32)] ring-1 ring-[#FDE8ED] hover:bg-[#FFE8EE]`;
  }

  if (variant === 'desktop') {
    return `${base} bg-white text-[#374151] ring-1 ring-[#EAECEF] hover:bg-[#FAFAFA]`;
  }

  return `${base} bg-[#F3F4F6] text-[#111827] hover:bg-[#E4E7EC]`;
}
