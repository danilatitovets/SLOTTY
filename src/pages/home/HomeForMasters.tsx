import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { HUB_PATH } from '../../app/paths';
import { homeOutlineBtn, homePinkBtn, homeSection, homeSectionSubtitle, homeSectionTitle } from './homeTheme';

const PERKS = [
  'Профиль мастера',
  'Услуги и цены',
  'График работы',
  'Заявки клиентов',
  'Напоминания',
  'Акции и свободные окна',
] as const;

export type HomeForMastersProps = {
  masterCtaPath: string;
  masterCtaLabel: string;
};

export const HomeForMasters: FC<HomeForMastersProps> = ({ masterCtaPath, masterCtaLabel }) => {
  return (
    <section className={homeSection} aria-labelledby="home-masters-cta-heading">
      <div className="rounded-[28px] bg-[#F1EFEF] p-4 shadow-[0_10px_36px_rgba(17,24,39,0.05)] sm:p-5">
        <div className="rounded-[24px] bg-white px-5 py-6 ring-1 ring-[#F3F4F6] shadow-[0_8px_28px_rgba(17,24,39,0.05)] sm:px-7 sm:py-8">
          <h2 id="home-masters-cta-heading" className={homeSectionTitle}>
            Вы мастер? Принимайте записи без переписок
          </h2>
          <p className={`${homeSectionSubtitle} mt-2 max-w-xl`}>
            Создайте профиль, добавьте услуги, настройте график и получайте заявки от клиентов в одном кабинете.
          </p>

          <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PERKS.map((item) => (
              <li
                key={item}
                className="rounded-2xl bg-[#FAF8F8] px-3 py-2.5 text-[13px] font-medium text-[#374151]"
              >
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <Link to={masterCtaPath} className={`${homePinkBtn} min-h-12 w-full text-center text-[15px] sm:flex-1`}>
              {masterCtaLabel}
            </Link>
            <a href={`${HUB_PATH}#tarify`} className={`${homeOutlineBtn} min-h-12 w-full text-center text-[15px] sm:flex-1`}>
              Смотреть тарифы
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
