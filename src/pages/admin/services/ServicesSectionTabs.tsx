import type { ComponentType } from 'react';
import {
  HiClipboardDocumentList,
  HiGift,
  HiReceiptPercent,
  HiSquares2X2,
} from 'react-icons/hi2';
import {
  adminSectionTabIconClass,
  adminSectionTabIconToneClass,
  adminSectionTabIndicatorClass,
  adminSectionTabLabelClass,
  adminSectionTabsNavClass,
  adminSectionTabTextClass,
} from '../shared/adminSectionTabsTheme';
import { AdminSectionAttentionBadge } from '../shared/AdminSectionAttentionBadge';
import type { ServicesTabId } from './servicesTypes';

const TABS: Array<{
  id: ServicesTabId;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}> = [
  { id: 'catalog', label: 'Каталог', Icon: HiSquares2X2 },
  { id: 'price', label: 'Прайс', Icon: HiClipboardDocumentList },
  { id: 'bundles', label: 'Наборы', Icon: HiGift },
  { id: 'promotions', label: 'Акции', Icon: HiReceiptPercent },
];

type Props = {
  active: ServicesTabId;
  onChange: (tab: ServicesTabId) => void;
  catalogAttention?: boolean;
  className?: string;
};

export function ServicesSectionTabs({
  active,
  onChange,
  catalogAttention = false,
  className = '',
}: Props) {
  return (
    <nav
      className={`${adminSectionTabsNavClass} ${className}`.trim()}
      aria-label="Разделы услуг"
    >
      {TABS.map((tab) => {
        const selected = active === tab.id;
        const Icon = tab.Icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={adminSectionTabTextClass(selected)}
          >
            <Icon
              className={`${adminSectionTabIconClass} ${adminSectionTabIconToneClass(selected)}`}
              aria-hidden
            />
            <span className={adminSectionTabLabelClass}>{tab.label}</span>
            {tab.id === 'catalog' && catalogAttention ? <AdminSectionAttentionBadge /> : null}
            {selected ? <span className={adminSectionTabIndicatorClass()} aria-hidden /> : null}
          </button>
        );
      })}
    </nav>
  );
}
