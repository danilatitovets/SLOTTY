import { SCHEDULE_KPI_TILE_BG, scheduleKpiTileOverlay } from './adminScheduleTheme';

export function ScheduleKpiPhotoBackdrop() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 scale-105 bg-cover bg-center"
        style={{ backgroundImage: `url(${SCHEDULE_KPI_TILE_BG})` }}
        aria-hidden
      />
      <div className={scheduleKpiTileOverlay} aria-hidden />
    </>
  );
}
