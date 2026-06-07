import { OVERVIEW_OPS_KPI_BG, overviewOpsKpiTileOverlay } from './adminOverviewTheme';

export function OverviewOpsKpiPhotoBackdrop() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 scale-105 bg-cover bg-center"
        style={{ backgroundImage: `url(${OVERVIEW_OPS_KPI_BG})` }}
        aria-hidden
      />
      <div className={overviewOpsKpiTileOverlay} aria-hidden />
    </>
  );
}
