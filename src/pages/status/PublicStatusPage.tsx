import { useCallback } from 'react';
import { StatusCenterView } from '../../features/systemStatus/StatusCenterView';
import { fetchPublicStatus } from '../../features/systemStatus/systemStatusApi';
import { HomeFooter } from '../HomeFooter';

export function PublicStatusPage() {
  const load = useCallback(() => fetchPublicStatus(), []);

  return (
    <>
      <StatusCenterView
        load={load}
        variant="public"
        reportIssueHref="/master/settings/support/contact"
      />
      <HomeFooter />
    </>
  );
}
