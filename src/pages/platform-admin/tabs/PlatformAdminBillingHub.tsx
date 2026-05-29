import { useSearchParams } from 'react-router-dom';
import { PlatformAdminPageIntro } from '../shared/PlatformAdminPageIntro';
import { paFilterChip } from '../platformAdminTheme';
import { PlatformAdminPromoCodesTab } from './PlatformAdminPromoCodesTab';
import { PlatformAdminPurchasesTab } from './PlatformAdminPurchasesTab';
import { PlatformAdminProPaymentsTab } from './PlatformAdminProPaymentsTab';

type BillingKind = 'purchases' | 'promo' | 'pro-payments';

const SEGMENTS: { id: BillingKind; label: string }[] = [
  { id: 'purchases', label: 'Покупки и сводка' },
  { id: 'pro-payments', label: 'Заявки Pro' },
  { id: 'promo', label: 'Промокоды' },
];

export function PlatformAdminBillingHub() {
  const [params, setParams] = useSearchParams();
  const kind: BillingKind =
    params.get('tab') === 'promo'
      ? 'promo'
      : params.get('tab') === 'pro-payments'
        ? 'pro-payments'
        : 'purchases';

  return (
    <div>
      <PlatformAdminPageIntro />

      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Биллинг">
        {SEGMENTS.map((seg) => (
          <button
            key={seg.id}
            type="button"
            role="tab"
            aria-selected={kind === seg.id}
            className={paFilterChip(kind === seg.id)}
            onClick={() => {
              if (seg.id === 'purchases') setParams({});
              else setParams({ tab: seg.id });
            }}
          >
            {seg.label}
          </button>
        ))}
      </div>

      {kind === 'purchases' ? (
        <PlatformAdminPurchasesTab />
      ) : kind === 'pro-payments' ? (
        <PlatformAdminProPaymentsTab />
      ) : (
        <PlatformAdminPromoCodesTab />
      )}
    </div>
  );
}
