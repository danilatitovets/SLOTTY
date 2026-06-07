import type { ReactNode } from 'react';
import {
  adminDesktopSectionTabsFixed,
  adminDesktopSectionTabsSpacer,
} from '../adminCabinetLayout';

type Props = {
  children: ReactNode;
  className?: string;
};

/** Второй хедер кабинета: прикреплён к AdminDesktopTopBar, контент скроллится ниже. */
export function AdminDesktopSectionTabsShell({ children, className = '' }: Props) {
  return (
    <div className="relative lg:-mt-6">
      <div className={`${adminDesktopSectionTabsFixed} h-[3.5rem] ${className}`.trim()}>{children}</div>
      <div className={adminDesktopSectionTabsSpacer} aria-hidden />
    </div>
  );
}
