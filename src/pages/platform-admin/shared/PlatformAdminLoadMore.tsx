import { paGhostBtn } from '../platformAdminTheme';

type Props = {
  loadedCount: number;
  total: number;
  loading: boolean;
  onLoadMore: () => void;
};

export function PlatformAdminLoadMore({ loadedCount, total, loading, onLoadMore }: Props) {
  if (loadedCount >= total) {
    if (total > 0) {
      return (
        <p className="py-4 text-center text-[14px] text-[#6B7280]">Больше записей нет</p>
      );
    }
    return null;
  }
  return (
    <div className="flex justify-center py-4">
      <button
        type="button"
        className={paGhostBtn}
        disabled={loading}
        onClick={onLoadMore}
      >
        {loading ? 'Загрузка…' : 'Показать ещё'}
      </button>
    </div>
  );
}
