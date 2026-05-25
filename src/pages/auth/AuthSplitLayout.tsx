import type { ReactNode } from 'react';
import { LoginLeftSlideshow } from './LoginLeftSlideshow';
import { AUTH_COL_BODY, AUTH_COL_PAD } from './authPageLayout';

type Props = {
  children: ReactNode;
};

/** Десктоп: слева фото, справа контент — как /login. */
export function AuthSplitLayout({ children }: Props) {
  return (
    <main className="min-h-dvh bg-white text-[#111827]">
      <div className="grid min-h-dvh lg:grid-cols-2">
        <LoginLeftSlideshow />
        <section className={`flex min-h-dvh flex-col items-center ${AUTH_COL_PAD}`}>
          <div className={AUTH_COL_BODY}>{children}</div>
        </section>
      </div>
    </main>
  );
}
