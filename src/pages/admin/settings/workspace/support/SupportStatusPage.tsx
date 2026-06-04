import { useCallback } from 'react';
import { StatusCenterView } from '../../../../../features/systemStatus/StatusCenterView';
import { fetchMasterStatus } from '../../../../../features/systemStatus/systemStatusApi';
import { SettingsHeader } from '../SettingsHeader';
import { SETTINGS_PAGE_META } from '../settingsNav';

const meta = SETTINGS_PAGE_META['system-status'];

export function SupportStatusPage() {
  const load = useCallback(() => fetchMasterStatus(), []);

  return (
    <>
      <SettingsHeader title={meta.title} description={meta.description} breadcrumb={meta.breadcrumb} />
      <StatusCenterView load={load} variant="cabinet" />
    </>
  );
}
