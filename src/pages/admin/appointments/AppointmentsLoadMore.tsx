type Props = {
  hasMore: boolean;
  loading: boolean;
  loadedCount: number;
  total: number;
  onLoadMore: () => void;
};

export function AppointmentsLoadMore({ hasMore, loading, loadedCount, total, onLoadMore }: Props) {
  if (!hasMore && total <= loadedCount) return null;

  return (
    <div className="flex flex-col items-center gap-2 pt-2 pb-1">
      <p className="text-[13px] font-medium text-[#9CA3AF]">
        Показано {loadedCount}
        {total > 0 ? ` из ${total}` : ''}
      </p>
      {hasMore ? (
        <button
          type="button"
          disabled={loading}
          onClick={onLoadMore}
          className="min-h-11 rounded-[14px] border border-[#EAECEF] bg-white px-5 text-[14px] font-semibold text-[#374151] transition hover:bg-[#FAFAFA] active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? 'Загрузка…' : 'Показать ещё'}
        </button>
      ) : null}
    </div>
  );
}
