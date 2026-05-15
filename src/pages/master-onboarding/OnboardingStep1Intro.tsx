import { useCallback, useEffect, useState, type ReactNode } from 'react';

const AUTO_MS = 4500;

type Slide = {
  imageSrc: string;
  title: string;
  text: string;
  icon: ReactNode;
};

const SLIDES: Slide[] = [
  {
    imageSrc: '/photos/step1/profile.png',
    title: 'Профиль',
    text: 'Имя, описание и контакты',
    icon: <IconProfile />,
  },
  {
    imageSrc: '/photos/step1/adress.png',
    title: 'Адрес',
    text: 'Место приёма клиентов',
    icon: <IconMap />,
  },
  {
    imageSrc: '/photos/step1/services.png',
    title: 'Услуги',
    text: 'Цены, длительность и описание',
    icon: <IconServices />,
  },
  {
    imageSrc: '/photos/step1/sertificate.png',
    title: 'Доверие',
    text: 'Сертификаты и подтверждения',
    icon: <IconTrust />,
  },
];

function IconProfile() {
  return (
    <svg className="h-5 w-5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M20 21a8 8 0 1 0-16 0" strokeLinecap="round" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function IconMap() {
  return (
    <svg className="h-5 w-5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10Z" strokeLinejoin="round" />
      <circle cx="12" cy="11" r="2.25" />
    </svg>
  );
}

function IconServices() {
  return (
    <svg className="h-5 w-5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M8 6h13M8 12h13M8 18h13" strokeLinecap="round" />
      <path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" strokeLinecap="round" strokeWidth="2.5" />
    </svg>
  );
}

function IconTrust() {
  return (
    <svg className="h-5 w-5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 3 4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-3Z" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function OnboardingStep1Intro() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((i: number) => {
    setIndex(((i % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const slide = SLIDES[index]!;

  return (
    <div
      className="mx-auto w-full max-w-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        className="relative overflow-hidden rounded-[32px] bg-[#F8F0F0] px-3 pb-2 pt-3 shadow-[inset_0_0_0_1px_rgba(226,149,149,0.12)] sm:rounded-[36px] sm:px-4 sm:pt-4"
        aria-roledescription="carousel"
        aria-label="Что входит в анкету мастера"
      >
        <div className="relative aspect-[4/4.2] w-full overflow-hidden rounded-[26px] bg-[#FDF6F6] sm:rounded-[28px]">
          {SLIDES.map((s, i) => (
            <img
              key={s.imageSrc}
              src={s.imageSrc}
              alt=""
              draggable={false}
              className={`absolute inset-0 h-full w-full object-contain object-center transition-opacity duration-700 ease-out ${
                i === index ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            />
          ))}
        </div>

        <div className="px-1 pb-1 pt-5 text-center sm:px-2 sm:pt-6" aria-live="polite">
          <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.06em] text-neutral-950 sm:text-[28px]">
            {slide.title}
          </h2>
          <p className="mt-2 text-[15px] leading-snug text-neutral-500 sm:text-[16px]">{slide.text}</p>

          <div
            className="mx-auto mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#E29595] text-white shadow-[0_10px_26px_rgba(226,149,149,0.32)]"
            aria-hidden
          >
            {slide.icon}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-2" role="tablist" aria-label="Слайды">
        {SLIDES.map((s, i) => (
          <button
            key={s.imageSrc}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`${s.title}: ${s.text}`}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index ? 'w-6 bg-[#E29595]' : 'w-2 bg-neutral-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
