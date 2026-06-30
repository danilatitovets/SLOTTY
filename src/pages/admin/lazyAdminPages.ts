import { lazy } from 'react';

/** Вкладки кабинета мастера — грузятся только при переходе на маршрут. */
export const AdminHomePage = lazy(() =>
  import('./profile/AdminHomePage').then((m) => ({ default: m.AdminHomePage })),
);
export const AdminOverviewPage = lazy(() =>
  import('./overview/AdminOverviewPage').then((m) => ({ default: m.AdminOverviewPage })),
);
export const AdminServicesPage = lazy(() =>
  import('./services/AdminServicesPage').then((m) => ({ default: m.AdminServicesPage })),
);
export const AdminSchedulePage = lazy(() =>
  import('./schedule/AdminSchedulePage').then((m) => ({ default: m.AdminSchedulePage })),
);
export const AdminAppointmentsPage = lazy(() =>
  import('./appointments/AdminAppointmentsPage').then((m) => ({ default: m.AdminAppointmentsPage })),
);
export const AdminBillingPage = lazy(() =>
  import('./billing/AdminBillingPage').then((m) => ({ default: m.AdminBillingPage })),
);
export const AdminNotificationsPage = lazy(() =>
  import('./notifications/AdminNotificationsPage').then((m) => ({ default: m.AdminNotificationsPage })),
);
export const AdminLoginMethodsPage = lazy(() =>
  import('./settings/AdminLoginMethodsPage').then((m) => ({ default: m.AdminLoginMethodsPage })),
);
export const ProfileCompletionPage = lazy(() =>
  import('./profile/ProfileCompletionPage').then((m) => ({ default: m.ProfileCompletionPage })),
);
