import { useEffect, useState } from 'react';

const LOGIN_SLIDES = [1, 2, 3, 4, 5, 6].map((n) => `/photos/login/${n}.webp`);
const SLIDE_MS = 5000;
const FADE_MS = 900;

export function LoginLeftSlideshow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % LOGIN_SLIDES.length);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section
      className="relative hidden min-h-dvh overflow-hidden bg-[#111827] lg:block"
      aria-hidden
    >
      {LOGIN_SLIDES.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          decoding="async"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover object-center"
          style={{
            opacity: i === index ? 1 : 0,
            transition: `opacity ${FADE_MS}ms ease-in-out`,
          }}
        />
      ))}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#111827]/25 via-transparent to-[#ff5f7a]/15"
        aria-hidden
      />
    </section>
  );
}
