import { useEffect, useState } from 'react';
import {
  fetchMasterAppointmentReview,
  fetchMasterReviewNotificationDetail,
  type MasterReviewNotificationDetail,
} from '../../../features/admin/api/masterOverviewApi';
import { ReviewNotificationDetailView } from '../notifications/ReviewNotificationDetailView';
import { AdminBottomSheet } from './AdminBottomSheet';
import { catalogSheetSecondaryBtn } from './adminCatalogSheetTheme';

type Props = {
  open: boolean;
  appointmentId: string;
  reviewId?: string | null;
  onClose: () => void;
};

export function MasterAppointmentReviewSheet({
  open,
  appointmentId,
  reviewId,
  onClose,
}: Props) {
  const [review, setReview] = useState<MasterReviewNotificationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setReview(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const detail = reviewId
          ? await fetchMasterReviewNotificationDetail(reviewId)
          : await fetchMasterAppointmentReview(appointmentId);
        if (!cancelled) setReview(detail);
      } catch (e) {
        if (!cancelled) {
          setReview(null);
          setError(e instanceof Error ? e.message : 'Не удалось загрузить отзыв');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, appointmentId, reviewId]);

  return (
    <AdminBottomSheet
      variant="catalog"
      open={open}
      onClose={onClose}
      title="Отзыв клиента"
      footer={
        <button type="button" onClick={onClose} className={catalogSheetSecondaryBtn}>
          Закрыть
        </button>
      }
    >
      {loading ? (
        <p className="py-6 text-center text-[14px] font-medium text-[#6B7280]">Загрузка отзыва…</p>
      ) : error ? (
        <p className="rounded-[12px] bg-[#FEF2F2] px-4 py-3 text-[14px] font-semibold text-[#EF4444]">
          {error}
        </p>
      ) : review ? (
        <ReviewNotificationDetailView review={review} />
      ) : null}
    </AdminBottomSheet>
  );
}
