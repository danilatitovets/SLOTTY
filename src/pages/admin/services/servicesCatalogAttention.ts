type ServiceLike = { id: string; isActive?: boolean };

type ServiceStatLike = { serviceId: string; availableSlotsCount: number };

export function countVisibleServicesWithoutSlots(
  services: ServiceLike[],
  stats: ServiceStatLike[],
): number {
  const statsById = new Map(stats.map((item) => [item.serviceId, item]));

  return services.filter((service) => {
    if (service.isActive === false) return false;
    return (statsById.get(service.id)?.availableSlotsCount ?? 0) <= 0;
  }).length;
}

export function hasVisibleServicesWithoutSlots(
  services: ServiceLike[],
  stats: ServiceStatLike[],
): boolean {
  return countVisibleServicesWithoutSlots(services, stats) > 0;
}
