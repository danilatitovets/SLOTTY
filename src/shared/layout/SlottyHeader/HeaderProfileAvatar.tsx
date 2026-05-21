import { HiUser } from 'react-icons/hi2';
import type { BackendProfile } from '../../../features/auth/types';

const avatarImgClass =
  'block h-7 w-7 min-h-7 min-w-7 shrink-0 aspect-square rounded-full object-cover object-center';

type Props = {
  profile: BackendProfile | null | undefined;
};

export function HeaderProfileAvatar({ profile }: Props) {
  const src = profile?.header_avatar_url?.trim() || null;

  if (!src) {
    return <HiUser className="h-5 w-5 shrink-0" aria-hidden />;
  }

  return <img src={src} alt="" className={avatarImgClass} />;
}
