import { Navigate, Route, Routes } from 'react-router-dom';
import {
  MASTER_SETTINGS_SYSTEM_STATUS_PATH,
  MASTER_SETTINGS_SUPPORT_PATH,
} from '../../../../../app/paths';
import { SupportContactPage } from '../support/SupportContactPage';
import { SupportDocsPage } from '../support/SupportDocsPage';
import { SupportGuidePage } from '../support/SupportGuidePage';
import { SupportMainPage } from '../support/SupportMainPage';
import { SupportTicketDetailPage } from '../support/SupportTicketDetailPage';
import { SupportTicketsPage } from '../support/SupportTicketsPage';

/** Hub маршрутов раздела «Поддержка». */
export function SettingsSupportPage() {
  return (
    <Routes>
      <Route index element={<SupportMainPage />} />
      <Route path="docs/:guideId" element={<SupportGuidePage />} />
      <Route path="docs" element={<SupportDocsPage />} />
      <Route path="contact" element={<SupportContactPage />} />
      <Route path="diagnostics" element={<Navigate to={MASTER_SETTINGS_SYSTEM_STATUS_PATH} replace />} />
      <Route path="status" element={<Navigate to={MASTER_SETTINGS_SYSTEM_STATUS_PATH} replace />} />
      <Route path="tickets" element={<SupportTicketsPage />} />
      <Route path="tickets/:ticketCode" element={<SupportTicketDetailPage />} />
      <Route path="*" element={<Navigate to={MASTER_SETTINGS_SUPPORT_PATH} replace />} />
    </Routes>
  );
}
