import type { ReactNode } from 'react';
import { CLIENT_CONTENT_PAD_BOTTOM, CLIENT_HEADER_OFFSET } from '../clientNavConstants';

type Props = {
  children: ReactNode;
  className?: string;
};

export function ClientPageShell({ children, className = '' }: Props) {
  return (
    <main
      className={`mx-auto w-full max-w-lg px-4 sm:px-5 ${CLIENT_HEADER_OFFSET} ${CLIENT_CONTENT_PAD_BOTTOM} ${className}`}
    >
      {children}
    </main>
  );
}
