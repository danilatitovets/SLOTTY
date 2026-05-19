import type { DemoMasterService } from '../../../features/services/model/demoMasters';
import { clientPinkBtn } from '../clientTheme';
import { ClientSheetShell } from './ClientSheetShell';
import { MasterPaymentMethodsBlock } from './MasterPaymentMethodsBlock';
import { formatServicePrice, serviceDurationLabel } from './masterProfileUtils';

type Props = {
  open: boolean;
  service: DemoMasterService | null;
  paymentMethods?: string[];
  paymentNote?: string;
  onClose: () => void;
  onChooseTime: () => void;
};

export function ServiceDetailSheet({
  open,
  service,
  paymentMethods = [],
  paymentNote,
  onClose,
  onChooseTime,
}: Props) {
  if (!service) return null;

  return (
    <ClientSheetShell
      open={open}
      onClose={onClose}
      title={service.title}
      footer={
        <button
          type="button"
          onClick={() => {
            onClose();
            onChooseTime();
          }}
          className={`${clientPinkBtn} w-full`}
        >
          Выбрать время
        </button>
      }
    >
      <p className="text-[14px] text-[#6B7280]">
        {serviceDurationLabel(service.duration)} · {formatServicePrice(service)}
      </p>
      {service.description?.trim() ? (
        <p className="mt-4 text-[15px] leading-relaxed text-[#374151]">{service.description}</p>
      ) : (
        <p className="mt-4 text-[14px] text-[#9CA3AF]">Описание скоро появится</p>
      )}

      {paymentMethods.length > 0 || paymentNote?.trim() ? (
        <div className="mt-5 rounded-[18px] bg-[#FAFAFA] p-4 ring-1 ring-[#F3F4F6]">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
            Способы оплаты
          </p>
          <MasterPaymentMethodsBlock methods={paymentMethods} note={paymentNote} compact />
        </div>
      ) : null}
    </ClientSheetShell>
  );
}
