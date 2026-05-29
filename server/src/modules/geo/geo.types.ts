export type GeoAddressHit = {
  id?: string;
  title?: string;
  subtitle?: string;
  /** Короткая строка для поля ввода после выбора. */
  addressLine: string;
  cleanAddress?: string;
  fullAddress?: string;
  city?: string;
  street?: string;
  building?: string;
  lat: number;
  lng: number;
};
