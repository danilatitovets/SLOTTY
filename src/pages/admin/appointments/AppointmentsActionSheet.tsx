import { useEffect, useState } from 'react';
import type { DemoMasterAppointment, DemoAppointmentStatus } from '../../../features/master/model/demoMasterAppointments';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import {
  catalogSheetField,
  catalogSheetLabel,
  catalogSheetPrimaryBtn,
  catalogSheetSecondaryBtn,
} from '../shared/adminCatalogSheetTheme';
import { formatAppointmentPrice } from './appointmentsFormat';

export type AppointmentActionKind = 'confirm' | 'reject' | 'complete' | 'cancel';

export type AppointmentActionConfig = {
  kind: AppointmentActionKind;
  title: string;
  text: string;
  buttonLabel: string;
  nextStatus: DemoAppointmentStatus;
  appointment: DemoMasterAppointment;
};

type Props = {
  config: AppointmentActionConfig | null;
  apiError: string | null;
  onClose: () => void;
  onConfirm: (rejectReason?: string) => void;
};

export function AppointmentsActionSheet({ config, apiError, onClose, onConfirm }: Props) {
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!config) setRejectReason('');
  }, [config]);

  const showCancelReason = config?.kind === 'reject' || config?.kind === 'cancel';
  const dangerAction = config?.kind === 'reject' || config?.kind === 'cancel';
  const cancelReasonRequired = config?.kind === 'reject' || config?.kind === 'cancel';

  return (
    <AdminBottomSheet
      variant="catalog"
      open={Boolean(config)}
      onClose={onClose}
      title={config?.title ?? ''}
      footer={
        config ? (
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <button type="button" onClick={onClose} className={catalogSheetSecondaryBtn}>
              Назад
            </button>
            <button
              type="button"
              onClick={() => {
                const reason = showCancelReason ? rejectReason.trim() : undefined;
                if (cancelReasonRequired && !reason) return;
                onConfirm(reason);
              }}
              disabled={cancelReasonRequired && !rejectReason.trim()}
              className={`${catalogSheetPrimaryBtn} ${dangerAction ? '!bg-[#EF4444] hover:!opacity-95' : ''}`}
            >
              {config.buttonLabel}
            </button>
          </div>
        ) : undefined
      }
    >
      {config ? (
        <div className="space-y-4">
          <div className="rounded-[10px] bg-[#F5F5F5] px-4 py-4 lg:px-5 lg:py-5">
            <p className="text-[17px] font-bold tracking-[-0.03em] text-[#111827] lg:text-[18px]">
              {config.appointment.clientName}
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-[#6B7280]">
              {config.appointment.serviceTitle}
            </p>
            <p className="mt-3 text-[14px] font-semibold text-[#374151]">
              {config.appointment.date} · {config.appointment.time}
            </p>
            <p className="mt-1 text-[16px] font-bold text-[#F47C8C]">
              {formatAppointmentPrice(config.appointment.priceByn)}
            </p>
          </div>

          <p className="text-[15px] leading-relaxed text-[#6B7280]">{config.text}</p>

          {showCancelReason ? (
            <label className="block">
              <span className={catalogSheetLabel}>
                Причина отмены{config.kind === 'reject' || config.kind === 'cancel' ? ' *' : ''}
              </span>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder={
                  config.kind === 'reject'
                    ? 'Например: нет свободного окна в это время'
                    : 'Например: заболел, не смогу принять клиента'
                }
                className={`${catalogSheetField} min-h-[5.5rem] resize-none`}
              />
            </label>
          ) : null}

          {apiError ? (
            <p className="rounded-[10px] bg-[#FEF2F2] px-4 py-3 text-[14px] font-semibold text-[#EF4444]">
              {apiError}
            </p>
          ) : null}
        </div>
      ) : null}
    </AdminBottomSheet>
  );
}
