import { CLIENT_DESKTOP_SHELL_CLASS } from '../../../shared/layout/clientShellLayout';
import {
  catalogDesktopPanel,
  masterProfileDesktopLayout,
  masterProfileDesktopMainCol,
  masterProfileDesktopSidebarCol,
} from './masterProfileTheme';

type Props = {
  desktop?: boolean;
};

export function SkeletonMasterProfile({ desktop = false }: Props) {
  if (desktop) {
    return (
      <div className="animate-pulse pb-12">
        <div className="fixed inset-x-0 top-0 z-[50] h-14 border-b border-[#EEEEEE] bg-white" aria-hidden />
        <div className="h-[260px] w-full bg-[#EBEBEB] pt-14" />
        <div className={`${CLIENT_DESKTOP_SHELL_CLASS} mx-auto max-w-[1240px] space-y-4`}>
          <div className="-mt-[72px] h-56 rounded-[24px] bg-white ring-1 ring-[#EEEEEE]" />
          <div className={masterProfileDesktopLayout}>
            <div className={`space-y-4 ${masterProfileDesktopMainCol}`}>
              <div className={`${catalogDesktopPanel} h-40 bg-[#EBEBEB]`} />
              <div className={`${catalogDesktopPanel} h-72 bg-[#EBEBEB]`} />
              <div className={`${catalogDesktopPanel} h-28 bg-[#EBEBEB]`} />
            </div>
            <div className={masterProfileDesktopSidebarCol}>
              <div className={`${catalogDesktopPanel} h-72 w-full bg-[#EBEBEB]`} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pulse pb-6">
      <div className="h-[160px] w-full bg-[#EBEBEB]" />
      <div className="space-y-4 px-4 pb-6 pt-0 sm:px-5">
        <div className="-mt-[52px] h-48 rounded-[24px] bg-white ring-1 ring-[#EEEEEE]" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`${catalogDesktopPanel} h-20 bg-[#EBEBEB]`} />
          ))}
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[7.5rem] w-[7.5rem] shrink-0 rounded-[12px] bg-[#EBEBEB]" />
          ))}
        </div>
      </div>
    </div>
  );
}
