import type { ManagedService } from './servicesFormat';
import { reindexManagedServices } from './servicesCabinetSync';

export function reorderManagedServiceList(
  services: ManagedService[],
  activeId: string,
  overId: string,
): ManagedService[] | null {
  const fromIndex = services.findIndex((service) => service.id === activeId);
  const toIndex = services.findIndex((service) => service.id === overId);

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return null;

  const next = [...services];
  const [removed] = next.splice(fromIndex, 1);
  if (!removed) return null;
  next.splice(toIndex, 0, removed);

  return reindexManagedServices(next);
}
