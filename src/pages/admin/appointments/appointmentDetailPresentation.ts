import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import type { MasterAppointmentPhase } from '../../../features/appointments/masterAppointmentLifecycle';
import { APPOINTMENTS_DETAIL_HERO_BG } from './adminAppointmentsTheme';
import { formatCardDateTime } from './appointmentsFormat';

export function isReturningClient(appointment: DemoMasterAppointment): boolean {
  const stats = appointment.clientStats;
  if (!stats) return false;
  if (stats.totalBookings > 1) return true;
  return !stats.isFirstTime;
}

export function appointmentDetailHeaderTitle(
  phase: MasterAppointmentPhase,
  appointment: DemoMasterAppointment,
): string {
  const uiStatus = appointment.status;
  const dbStatus = appointment.dbStatus ?? uiStatus;

  if (
    uiStatus === 'cancelled' ||
    dbStatus === 'cancelled_by_client' ||
    dbStatus === 'cancelled_by_master' ||
    dbStatus === 'cancelled_by_admin'
  ) {
    return 'Запись отменена';
  }

  if (phase === 'pending') return 'Заявка на запись';
  if (phase === 'completed' || phase === 'terminal') return 'Запись завершена';
  if (phase === 'requires_attention') return 'Запись требует внимания';
  return 'Предстоящая запись';
}

export function appointmentDetailHeaderSubtitle(appointment: DemoMasterAppointment): string {
  const time = appointment.timeLabel ?? appointment.time;
  const dateLabel = formatCardDateTime(appointment.date, time);
  const dateShort = dateLabel.split(' · ')[0] ?? dateLabel;
  return `${appointment.serviceTitle} · ${dateShort} · ${time}`;
}

export type StatusBadgeTone = 'pending' | 'upcoming' | 'active' | 'attention' | 'completed' | 'cancelled' | 'neutral';

export function appointmentDetailStatusTone(
  phase: MasterAppointmentPhase,
  appointment: DemoMasterAppointment,
): StatusBadgeTone {
  const uiStatus = appointment.status;
  const dbStatus = appointment.dbStatus ?? uiStatus;

  if (
    uiStatus === 'cancelled' ||
    dbStatus === 'cancelled_by_client' ||
    dbStatus === 'cancelled_by_master' ||
    dbStatus === 'cancelled_by_admin'
  ) {
    return 'cancelled';
  }
  if (phase === 'pending') return 'pending';
  if (phase === 'completed' || phase === 'terminal') return 'completed';
  if (phase === 'requires_attention') return 'attention';
  if (phase === 'in_progress' || phase === 'visit_window') return 'active';
  if (phase === 'before_visit') return 'upcoming';
  return 'neutral';
}

export function appointmentDetailStatusBadgeClass(tone: StatusBadgeTone): string {
  switch (tone) {
    case 'pending':
      return 'bg-[#FFF4E8] text-[#B45309] ring-1 ring-[#FDE68A]/80';
    case 'upcoming':
      return 'bg-[#ECFDF5] text-[#16A34A] ring-1 ring-[#BBF7D0]/90';
    case 'active':
      return 'bg-[#FFF1F4] text-[#F47C8C] ring-1 ring-[#FECDD3]/90';
    case 'attention':
      return 'bg-[#FEF2F2] text-[#B91C1C] ring-1 ring-[#FECACA]/90';
    case 'completed':
      return 'bg-[#EEF2FF] text-[#4F46E5] ring-1 ring-[#C7D2FE]/90';
    case 'cancelled':
      return 'bg-[#F3F4F6] text-[#6B7280] ring-1 ring-[#E5E7EB]';
    default:
      return 'bg-[#F5F5F5] text-[#6B7280] ring-1 ring-[#EEEEEE]';
  }
}

export function appointmentDetailHeroBackground(tone: StatusBadgeTone): string {
  return APPOINTMENTS_DETAIL_HERO_BG[tone];
}

export function appointmentDetailHeroOverlayClass(tone: StatusBadgeTone): string {
  switch (tone) {
    case 'pending':
      return 'bg-gradient-to-br from-[#FFF4E8]/88 via-white/84 to-white/94';
    case 'upcoming':
      return 'bg-gradient-to-br from-[#ECFDF5]/88 via-white/84 to-white/94';
    case 'active':
      return 'bg-gradient-to-br from-[#FFF1F4]/88 via-white/84 to-white/94';
    case 'attention':
      return 'bg-gradient-to-br from-[#FEF2F2]/88 via-white/84 to-white/94';
    case 'completed':
      return 'bg-gradient-to-br from-[#ECFDF5]/90 via-white/86 to-white/94';
    case 'cancelled':
      return 'bg-gradient-to-br from-[#FEF2F2]/90 via-white/86 to-white/94';
    default:
      return 'bg-gradient-to-br from-[#FFF1F4]/86 via-white/84 to-white/94';
  }
}

/** Статус в hero-карточке визита — без обводок. */
export function appointmentDetailHeroStatusBadgeClass(tone: StatusBadgeTone): string {
  switch (tone) {
    case 'pending':
      return 'bg-[#FFF4E8] text-[#B45309]';
    case 'upcoming':
    case 'completed':
      return 'bg-[#ECFDF5] text-[#16A34A]';
    case 'active':
      return 'bg-[#FFF1F4] text-[#F47C8C]';
    case 'attention':
      return 'bg-[#FEF2F2] text-[#B91C1C]';
    case 'cancelled':
      return 'bg-[#F3F4F6] text-[#6B7280]';
    default:
      return 'bg-[#F5F5F5] text-[#6B7280]';
  }
}
