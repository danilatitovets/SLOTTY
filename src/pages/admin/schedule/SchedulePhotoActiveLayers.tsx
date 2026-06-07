import { SCHEDULE_QUICK_SETUP_IMAGES } from './scheduleQuickSetupAssets';

export function SchedulePhotoActiveLayers() {
  return (
    <>
      <span
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${SCHEDULE_QUICK_SETUP_IMAGES.tabCreateActiveBg})` }}
        aria-hidden
      />
      <span className="pointer-events-none absolute inset-0 bg-white/55" aria-hidden />
    </>
  );
}
