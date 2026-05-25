import { HiCheckBadge } from 'react-icons/hi2';

type Props = {
  className?: string;
  title?: string;
};

const defaultTitle =
  'Проверенный мастер: подключены Telegram, Google и подтверждённый email';

export function MasterVerifiedBadge({
  className = 'h-6 w-6 shrink-0 text-[#F47C8C]',
  title = defaultTitle,
}: Props) {
  return <HiCheckBadge className={className} aria-label={title} title={title} />;
}
