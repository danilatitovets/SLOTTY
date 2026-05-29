import type { ReactNode } from 'react';
import { MiniPicture } from '../../../shared/ui/MiniPicture';
import { notifCardShell } from './adminNotificationsTheme';

type Props = {
  title: string;
  text: string;
  icon?: ReactNode;
};

export function NotificationsEmptyState({ title, text, icon }: Props) {
  return (
    <section className={`${notifCardShell} flex flex-col items-center px-6 py-9 text-center`}>
      {icon ?? <MiniPicture name="notificationsEmpty" variant="empty" className="mb-1" />}
      <h3 className="mt-5 text-[18px] font-bold tracking-[-0.03em] text-[#111827]">{title}</h3>
      <p className="mt-2 max-w-[18rem] text-[15px] leading-relaxed text-[#6B7280]">{text}</p>
    </section>
  );
}
