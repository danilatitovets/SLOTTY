import { Link } from 'react-router-dom';
import { ADMIN_DESKTOP_LOGO_SRC } from '../../app/headerLogo';

type Props = {
  to: string;
  ariaLabel?: string;
};

/** Как в прежнем сайдбаре: крупный логотип с обрезкой сверху. */
export function CabinetDesktopHeaderLogo({ to, ariaLabel = 'SLOTTY — на главную' }: Props) {
  return (
    <div className="relative h-full overflow-hidden">
      <Link
        to={to}
        aria-label={ariaLabel}
        className="inline-flex max-w-full -translate-y-8 no-underline"
      >
        <img
          src={ADMIN_DESKTOP_LOGO_SRC}
          alt=""
          className="h-[10rem] w-auto max-w-full object-contain object-left"
        />
      </Link>
    </div>
  );
}
