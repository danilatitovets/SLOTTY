type Props = { className?: string };

/** Иконка маршрута в Яндекс.Картах (как в карточке записи клиента). */
export function YandexMapsRouteIcon({ className }: Props) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="7" cy="17" r="2.5" />
      <circle cx="17" cy="7" r="2.5" />
      <path d="M9 15l6-6M15 9h4v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
