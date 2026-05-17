import { useMemo, useState } from 'react';
import { HiGift } from 'react-icons/hi2';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { LoadingVideo } from '../../../shared/ui/LoadingVideo';
import {
  servicesCard,
  servicesIconCircle,
  servicesPinkBtn,
} from './adminServicesTheme';
import { ServicesBundleCard } from './ServicesBundleCard';
import { ServicesBundleFormSheet } from './ServicesBundleFormSheet';
import { ServicesBundleMenuSheet } from './ServicesBundleMenuSheet';
import type { ManagedService } from './servicesFormat';
import type { ServiceBundle } from './servicesTypes';

type Props = {
  draft: MasterDraft;
  services: ManagedService[];
  bundles: ServiceBundle[];
  loading?: boolean;
  extrasLocked?: boolean;
  onExtrasLocked?: () => void;
  onSave: (bundle: ServiceBundle) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
};

export function ServicesBundlesTab({
  draft,
  services,
  bundles,
  loading = false,
  extrasLocked = false,
  onExtrasLocked,
  onSave,
  onDelete,
}: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceBundle | null>(null);
  const [menuTarget, setMenuTarget] = useState<ServiceBundle | null>(null);
  const [saving, setSaving] = useState(false);

  const serviceTitleById = useMemo(() => {
    const m = new Map<string, string>();
    services.forEach((s) => m.set(s.id, s.title));
    return m;
  }, [services]);

  const sortedBundles = useMemo(
    () => [...bundles].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [bundles],
  );

  const tryExtrasAction = (action: () => void) => {
    if (extrasLocked) {
      onExtrasLocked?.();
      return;
    }
    action();
  };

  const openCreate = () => {
    tryExtrasAction(() => {
      setEditing(null);
      setFormOpen(true);
    });
  };

  const openEdit = (bundle: ServiceBundle) => {
    tryExtrasAction(() => {
      setEditing(bundle);
      setFormOpen(true);
    });
  };

  const handleSave = (bundle: ServiceBundle) => {
    void (async () => {
      setSaving(true);
      try {
        await onSave(bundle);
        setFormOpen(false);
        setEditing(null);
      } finally {
        setSaving(false);
      }
    })();
  };

  const handleDelete = (id: string) => {
    void onDelete(id);
  };

  const canCreate = !extrasLocked && services.length >= 2;

  if (loading) {
    return (
      <div className="flex min-h-[14rem] items-center justify-center py-8">
        <LoadingVideo size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-2">
      {sortedBundles.length > 0 ? (
        <button
          type="button"
          onClick={openCreate}
          disabled={!canCreate || saving}
          className={servicesPinkBtn}
        >
          + Создать набор
        </button>
      ) : null}

      {!extrasLocked && !canCreate ? (
        <p className="text-[13px] font-medium text-[#9CA3AF]">
          Добавьте минимум 2 услуги в каталоге, чтобы создать набор
        </p>
      ) : null}

      {sortedBundles.length === 0 ? (
        <div className={`${servicesCard} p-6 text-center`}>
          <span className={`${servicesIconCircle} mx-auto h-16 w-16 rounded-[22px]`}>
            <HiGift className="h-8 w-8" aria-hidden />
          </span>
          <h3 className="mt-4 text-[18px] font-bold tracking-[-0.04em] text-[#111827]">
            Наборов пока нет
          </h3>
          <p className="mx-auto mt-2 max-w-[18rem] text-[13px] leading-relaxed text-[#6B7280]">
            Создайте комбо из нескольких услуг, чтобы увеличить средний чек
          </p>
          <button
            type="button"
            onClick={openCreate}
            disabled={!canCreate || saving}
            className={`${servicesPinkBtn} mt-5`}
          >
            + Создать набор
          </button>
        </div>
      ) : (
        <ul className="space-y-3.5">
          {sortedBundles.map((bundle) => (
            <li key={bundle.id}>
              <ServicesBundleCard
                bundle={bundle}
                services={services}
                draft={draft}
                serviceTitleById={serviceTitleById}
                onMenu={() => {
                  if (extrasLocked) {
                    onExtrasLocked?.();
                    return;
                  }
                  setMenuTarget(bundle);
                }}
              />
            </li>
          ))}
        </ul>
      )}

      <ServicesBundleFormSheet
        open={formOpen}
        draft={draft}
        services={services}
        initial={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      <ServicesBundleMenuSheet
        open={Boolean(menuTarget)}
        bundle={menuTarget}
        onClose={() => setMenuTarget(null)}
        onEdit={() => {
          if (menuTarget) openEdit(menuTarget);
          setMenuTarget(null);
        }}
        onDelete={() => {
          if (menuTarget) handleDelete(menuTarget.id);
          setMenuTarget(null);
        }}
      />
    </div>
  );
}
