import { SERVICES_CATALOG_ADD_BTN_BG, SERVICES_HERO_BG } from './adminServicesTheme';

/** Красный фон (`история/красный.png`). */
export function ServicesKpiPhotoBackdrop() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 scale-105 bg-cover bg-center"
        style={{ backgroundImage: `url(${SERVICES_CATALOG_ADD_BTN_BG})` }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-[#EF4444]/25" aria-hidden />
    </>
  );
}

/** Фон сводки услуг (`fon.webp`). */
export function ServicesFocusPhotoBackdrop() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 scale-105 bg-cover bg-center"
        style={{ backgroundImage: `url(${SERVICES_HERO_BG})` }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-black/40" aria-hidden />
    </>
  );
}
