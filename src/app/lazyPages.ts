import { lazy } from 'react';

/** Тяжёлые страницы — отдельные чанки, чтобы /book и лендинг не тянули кабинеты. */
export const AdminPage = lazy(() =>
  import('../pages/admin/AdminPage').then((m) => ({ default: m.AdminPage })),
);
export const MasterSettingsPage = lazy(() =>
  import('../pages/admin/settings/MasterSettingsPage').then((m) => ({ default: m.MasterSettingsPage })),
);
export const PlatformAdminPage = lazy(() =>
  import('../pages/platform-admin/PlatformAdminPage').then((m) => ({ default: m.PlatformAdminPage })),
);
export const ProfilePage = lazy(() =>
  import('../pages/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
export const ClientNotificationsPage = lazy(() =>
  import('../pages/profile/notifications/ClientNotificationsPage').then((m) => ({
    default: m.ClientNotificationsPage,
  })),
);
export const ClientSettingsPage = lazy(() =>
  import('../pages/profile/settings/ClientSettingsPage').then((m) => ({ default: m.ClientSettingsPage })),
);
export const BecomeMasterPage = lazy(() =>
  import('../pages/master-onboarding/BecomeMasterPage').then((m) => ({ default: m.BecomeMasterPage })),
);
export const BookingPage = lazy(() =>
  import('../pages/booking/BookingPage').then((m) => ({ default: m.BookingPage })),
);
export const ClientBookingDetailPage = lazy(() =>
  import('../pages/booking/ClientBookingDetailPage').then((m) => ({ default: m.ClientBookingDetailPage })),
);
export const ClientAppointmentReviewPage = lazy(() =>
  import('../pages/booking/ClientAppointmentReviewPage').then((m) => ({
    default: m.ClientAppointmentReviewPage,
  })),
);
export const MasterBookingDetailPage = lazy(() =>
  import('../pages/booking/MasterBookingDetailPage').then((m) => ({ default: m.MasterBookingDetailPage })),
);
