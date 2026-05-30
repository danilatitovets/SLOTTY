import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BOOKING_PATH } from '../app/paths';
import { unsubscribeFromNewsletter } from '../features/newsletter/api/newsletterApi';

export function UnsubscribeNewsletterPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');
  const [already, setAlready] = useState(false);

  useEffect(() => {
    if (!token?.trim()) {
      setState('error');
      return;
    }

    let cancelled = false;
    void unsubscribeFromNewsletter(token)
      .then((result) => {
        if (cancelled) return;
        setAlready(result.already);
        setState('done');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#FFF8F9] px-5 py-12">
      <div className="w-full max-w-md rounded-3xl border border-[#FCE7EC] bg-white p-8 shadow-[0_12px_40px_rgba(17,24,39,0.06)]">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#F47C8C]">SLOTTY</p>
        <h1 className="mt-3 text-[24px] font-bold tracking-[-0.03em] text-[#111827]">Отписка от рассылки</h1>

        {state === 'loading' ? (
          <p className="mt-4 text-[15px] text-[#6B7280]">Обрабатываем запрос…</p>
        ) : null}

        {state === 'done' ? (
          <p className="mt-4 text-[15px] leading-relaxed text-[#6B7280]">
            {already
              ? 'Вы уже отписаны от новостной рассылки SLOTTY.'
              : 'Вы отписались от новостной рассылки SLOTTY. Больше маркетинговых писем на этот адрес отправляться не будут.'}
          </p>
        ) : null}

        {state === 'error' ? (
          <p className="mt-4 text-[15px] leading-relaxed text-[#6B7280]">
            Не удалось обработать ссылку отписки. Возможно, она устарела или уже использована.
          </p>
        ) : null}

        <Link
          to={BOOKING_PATH}
          className="mt-8 inline-flex h-11 items-center justify-center rounded-2xl bg-[#ff5f7a] px-5 text-[14px] font-semibold text-white transition hover:bg-[#f94f6c]"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}
