import { useNavigate } from 'react-router-dom';

const NOT_FOUND_ILLUSTRATION_SRC = '/photos/404/1.webp';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-4 py-10">
      <img
        src={NOT_FOUND_ILLUSTRATION_SRC}
        alt="404 — страница не найдена"
        width={640}
        height={640}
        decoding="async"
        className="h-auto w-full max-w-[min(100%,640px)] object-contain"
      />
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mt-6 text-[15px] font-semibold text-[#F47C8C] underline-offset-2 hover:underline"
      >
        Вернуться назад
      </button>
    </main>
  );
}
