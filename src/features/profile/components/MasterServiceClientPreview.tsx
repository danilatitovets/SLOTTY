import type { ReactNode } from 'react';
import type { DemoMasterService } from '../../services/model/demoMasters';
import { MasterServicesList } from '../../../pages/client/masterProfile/MasterServicesList';
import { catalogCanvasClass } from '../../../pages/client/masterProfile/masterProfileTheme';

type Props = {
  service: DemoMasterService;
  categoryCode?: string;
  categoryLabel?: string;
  notice?: ReactNode;
};

/** Превью строки услуги — как в публичном профиле мастера (`MasterServicesList`, previewMode). */
export function MasterServiceClientPreview({
  service,
  categoryCode,
  categoryLabel,
  notice,
}: Props) {
  return (
    <div className="space-y-3">
      {notice}
      <div
        className={`overflow-hidden rounded-[16px] ring-1 ring-[#EAECEF] ${catalogCanvasClass}`}
        aria-label="Превью услуги для клиента"
      >
        <div className="pointer-events-none select-none p-4">
          <MasterServicesList
            services={[service]}
            categoryCode={categoryCode}
            categoryLabel={categoryLabel}
            highlightServiceId={service.id}
            previewMode
            onSelect={() => {}}
          />
        </div>
      </div>

    </div>
  );
}
