/**
 * Внешние ссылки на Яндекс.Карты без JavaScript API.
 */

export function makeYandexMapsRouteUrl(params: {
  lat?: number | null;
  lng?: number | null;
  addressLine?: string | null;
}): string {
  const lat = params.lat;
  const lng = params.lng;
  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    const p = new URLSearchParams();
    p.set('rtext', `~${lat},${lng}`);
    p.set('rtt', 'auto');
    return `https://yandex.by/maps/?${p.toString()}`;
  }

  const text = params.addressLine?.trim();
  if (text) {
    const p = new URLSearchParams();
    p.set('text', text);
    return `https://yandex.by/maps/?${p.toString()}`;
  }

  return 'https://yandex.by/maps/?text=Минск';
}

export function makeYandexMapsPointUrl(lat: number, lng: number): string {
  const ll = `${lng},${lat}`;
  return `https://yandex.by/maps/?ll=${encodeURIComponent(ll)}&z=16&pt=${encodeURIComponent(ll)},pm2rdm`;
}
