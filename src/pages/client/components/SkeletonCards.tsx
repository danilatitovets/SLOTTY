export function SkeletonServiceCard() {
  return (
    <div className="flex gap-3 rounded-[24px] bg-white p-3 shadow-[0_8px_28px_rgba(17,24,39,0.06)] ring-1 ring-[#F3F4F6]">
      <div className="h-[88px] w-[88px] shrink-0 animate-pulse rounded-[20px] bg-neutral-200/80" />
      <div className="min-w-0 flex-1 space-y-2 py-1">
        <div className="h-5 w-3/4 animate-pulse rounded-full bg-neutral-200/80" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-neutral-200/70" />
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-neutral-200/60" />
      </div>
    </div>
  );
}

export function SkeletonMasterCard() {
  return (
    <div className="rounded-[24px] bg-white p-4 shadow-[0_8px_28px_rgba(17,24,39,0.06)] ring-1 ring-[#F3F4F6]">
      <div className="flex gap-3">
        <div className="h-20 w-20 shrink-0 animate-pulse rounded-[22px] bg-neutral-200/80" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-5 w-2/3 animate-pulse rounded-full bg-neutral-200/80" />
          <div className="h-4 w-1/2 animate-pulse rounded-full bg-neutral-200/70" />
          <div className="h-4 w-3/4 animate-pulse rounded-full bg-neutral-200/60" />
        </div>
      </div>
      <div className="mt-4 h-11 w-full animate-pulse rounded-full bg-neutral-200/70" />
    </div>
  );
}
