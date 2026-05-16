import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { AddWindowForm } from './AddWindowForm';
import type { MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';
import type { PlannedSlot, RepeatKind, WindowTemplate } from './scheduleTypes';
import type { RepeatCount } from './RepeatSettings';

type Props = {
  open: boolean;
  onClose: () => void;
  dateIso: string;
  onDateIsoChange: (v: string) => void;
  startTime: string;
  onStartTimeChange: (v: string) => void;
  endTime: string;
  onEndTimeChange: (v: string) => void;
  manualMode: boolean;
  onManualModeChange: (v: boolean) => void;
  serviceId: string;
  onServiceIdChange: (v: string) => void;
  selectedTemplateId: string | null;
  templates: WindowTemplate[];
  services: MasterOnboardingService[];
  serviceOptions: { value: string; label: string }[];
  repeatKind: RepeatKind;
  onRepeatKindChange: (k: RepeatKind) => void;
  repeatCount: RepeatCount;
  onRepeatCountChange: (n: RepeatCount) => void;
  plannedSlots: PlannedSlot[];
  creatableCount: number;
  beyondHorizon: number;
  horizonDays: number | null;
  summaryLine: string | null;
  createError: string | null;
  saving: boolean;
  onSubmit: () => void;
};

export function AddWindowSheet({ open, onClose, ...form }: Props) {
  const { onSubmit, saving, ...rest } = form;

  const handleSubmit = () => {
    onSubmit();
  };

  return (
    <AdminBottomSheet open={open} onClose={onClose} title="Новое окно">
      <AddWindowForm
        {...rest}
        variant="sheet"
        saving={saving}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </AdminBottomSheet>
  );
}
