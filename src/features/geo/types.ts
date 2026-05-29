export type GeoAddressHit = {
  id?: string;
  title?: string;
  subtitle?: string;
  /** Короткая строка для поля ввода после выбора. */
  addressLine: string;
  cleanAddress?: string;
  fullAddress?: string;
  displayName?: string;
  city?: string;
  street?: string;
  building?: string;
  lat: number;
  lng: number;
  /** Nominatim payload when returned by geo API. */
  raw?: Record<string, unknown>;
};

export type MapPickResult = {
  addressLine: string;
  lat: number;
  lng: number;
};
