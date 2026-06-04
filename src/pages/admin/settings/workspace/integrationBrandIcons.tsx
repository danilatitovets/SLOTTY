import type { ReactNode } from 'react';
import { FaTelegramPlane } from 'react-icons/fa';
import { GoogleIcon } from '../../../../shared/ui/GoogleIcon';

type IconProps = {
  size?: number;
  className?: string;
};

function shellClassName(className?: string) {
  return className ?? '';
}

export function TelegramBrandIcon({ size = 22, className }: IconProps) {
  const plane = Math.max(10, Math.round(size * 0.46));
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#2AABEE] ${shellClassName(className)}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <FaTelegramPlane size={plane} className="-ml-px text-white" />
    </span>
  );
}

export function GoogleBrandIcon({ size = 22, className }: IconProps) {
  return <GoogleIcon size={size} className={shellClassName(className)} />;
}

export function YandexMapsBrandIcon({ size = 22, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      className={shellClassName(className)}
    >
      <rect width="24" height="24" rx="6" fill="#FC3F1D" />
      <path
        fill="#fff"
        d="M12 5.5c-2.76 0-5 2.05-5 4.58 0 2.86 3.04 5.42 4.95 7.84.42.52 1.08.52 1.5 0C15.36 15.5 18.4 12.94 18.4 10.08 18.4 7.55 16.16 5.5 12 5.5Zm0 2.4a2.18 2.18 0 1 1 0 4.36 2.18 2.18 0 0 1 0-4.36Z"
      />
    </svg>
  );
}

export function ResendBrandIcon({ size = 22, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      className={shellClassName(className)}
    >
      <rect width="24" height="24" rx="6" fill="#000" />
      <path
        fill="#fff"
        d="M7.2 8.4 12 6l4.8 2.4v7.2L12 18l-4.8-2.4V8.4Zm1.8 1.35v5.5L12 16.2l2.2-1.1v-2.2L12 11.8l-2.2 1.1v-2.15Z"
      />
    </svg>
  );
}

export function GoogleCalendarBrandIcon({ size = 22, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      className={shellClassName(className)}
    >
      <rect x="3" y="4" width="18" height="17" rx="2" fill="#fff" stroke="#E5E7EB" />
      <rect x="3" y="4" width="18" height="5" rx="2" fill="#1A73E8" />
      <rect x="6" y="11" width="3.5" height="3.5" rx="0.5" fill="#EA4335" />
      <rect x="10.25" y="11" width="3.5" height="3.5" rx="0.5" fill="#FBBC04" />
      <rect x="14.5" y="11" width="3.5" height="3.5" rx="0.5" fill="#34A853" />
      <rect x="6" y="15.5" width="3.5" height="3.5" rx="0.5" fill="#4285F4" />
      <rect x="10.25" y="15.5" width="3.5" height="3.5" rx="0.5" fill="#EA4335" />
    </svg>
  );
}

export function WebhooksBrandIcon({ size = 22, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      className={shellClassName(className)}
    >
      <rect width="24" height="24" rx="6" fill="#111827" />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
        d="M8 8h8M8 12h5M8 16h8M15 15l2 2 2-2"
      />
    </svg>
  );
}

export type IntegrationBrandId =
  | 'telegram'
  | 'google'
  | 'yandex'
  | 'resend'
  | 'google-calendar'
  | 'webhooks';

export function integrationBrandIcon(id: IntegrationBrandId, size = 22): ReactNode {
  switch (id) {
    case 'telegram':
      return <TelegramBrandIcon size={size} />;
    case 'google':
      return <GoogleBrandIcon size={size} />;
    case 'yandex':
      return <YandexMapsBrandIcon size={size} />;
    case 'resend':
      return <ResendBrandIcon size={size} />;
    case 'google-calendar':
      return <GoogleCalendarBrandIcon size={size} />;
    case 'webhooks':
      return <WebhooksBrandIcon size={size} />;
    default:
      return null;
  }
}
