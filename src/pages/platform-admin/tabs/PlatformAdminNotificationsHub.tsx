import { useSearchParams } from 'react-router-dom';
import { PlatformAdminPageIntro } from '../shared/PlatformAdminPageIntro';
import { paFilterChip } from '../platformAdminTheme';
import { PlatformAdminEmailCampaignsTab } from './PlatformAdminEmailCampaignsTab';
import { PlatformAdminDeliveriesTab } from './PlatformAdminDeliveriesTab';

type NotificationsKind = 'campaigns' | 'deliveries';

const SEGMENTS: { id: NotificationsKind; label: string }[] = [
  { id: 'campaigns', label: 'Email-рассылки' },
  { id: 'deliveries', label: 'Логи доставки' },
];

export function PlatformAdminNotificationsHub() {
  const [params, setParams] = useSearchParams();
  const kind: NotificationsKind = params.get('tab') === 'deliveries' ? 'deliveries' : 'campaigns';

  return (
    <div>
      <PlatformAdminPageIntro />

      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Уведомления">
        {SEGMENTS.map((seg) => (
          <button
            key={seg.id}
            type="button"
            role="tab"
            aria-selected={kind === seg.id}
            className={paFilterChip(kind === seg.id)}
            onClick={() => {
              if (seg.id === 'campaigns') setParams({});
              else setParams({ tab: seg.id });
            }}
          >
            {seg.label}
          </button>
        ))}
      </div>

      {kind === 'campaigns' ? <PlatformAdminEmailCampaignsTab /> : <PlatformAdminDeliveriesTab />}
    </div>
  );
}
