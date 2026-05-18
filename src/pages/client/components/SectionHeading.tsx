import { Link } from 'react-router-dom';

type Props = {
  title: string;
  href?: string;
  linkLabel?: string;
};

export function SectionHeading({ title, href, linkLabel = 'Все' }: Props) {
  return (
    <div className="mb-3 flex items-end justify-between gap-2">
      <h2 className="text-[20px] font-semibold tracking-tight text-[#111827]">{title}</h2>
      {href ? (
        <Link to={href} className="shrink-0 text-[14px] font-semibold text-[#F47C8C]">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
