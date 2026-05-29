import { useSearchParams } from 'react-router-dom';
import { PlatformAdminPageIntro } from '../shared/PlatformAdminPageIntro';
import { paFilterChip } from '../platformAdminTheme';
import { PlatformAdminProfileReportsTab } from './PlatformAdminProfileReportsTab';
import { PlatformAdminRequestsTab } from './PlatformAdminRequestsTab';
import { PlatformAdminSponsorRequestsTab } from './PlatformAdminSponsorRequestsTab';

type RequestKind = 'category' | 'sponsor' | 'profile-reports';

const SEGMENTS: { id: RequestKind; label: string }[] = [
  { id: 'category', label: 'Смена категории' },
  { id: 'sponsor', label: 'Спонсор SLOTTY' },
  { id: 'profile-reports', label: 'Жалобы на профили' },
];

function parseKind(raw: string | null): RequestKind {
  if (raw === 'sponsor') return 'sponsor';
  if (raw === 'profile-reports') return 'profile-reports';
  return 'category';
}

export function PlatformAdminRequestsHub() {
  const [params, setParams] = useSearchParams();
  const kind = parseKind(params.get('kind'));

  return (
    <div>
      <PlatformAdminPageIntro />

      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Тип заявок">
        {SEGMENTS.map((seg) => (
          <button
            key={seg.id}
            type="button"
            role="tab"
            aria-selected={kind === seg.id}
            className={paFilterChip(kind === seg.id)}
            onClick={() => {
              if (seg.id === 'category') setParams({});
              else setParams({ kind: seg.id });
            }}
          >
            {seg.label}
          </button>
        ))}
      </div>

      {kind === 'category' ? (
        <PlatformAdminRequestsTab />
      ) : kind === 'sponsor' ? (
        <PlatformAdminSponsorRequestsTab />
      ) : (
        <PlatformAdminProfileReportsTab />
      )}
    </div>
  );
}
