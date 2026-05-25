import { useEffect, useMemo, useState } from 'react';

const COLLAPSED_PARAGRAPHS = 2;

function splitParagraphs(text: string): string[] {
  const normalized = text.trim();
  if (!normalized) return [];
  const byBlank = normalized
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (byBlank.length > 1) return byBlank;
  const byLine = normalized
    .split(/\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return byLine.length > 1 ? byLine : [normalized];
}

type AboutDescriptionTextProps = {
  text: string;
  placeholder: string;
  emptyClassName?: string;
  textClassName?: string;
};

export function AboutDescriptionText({
  text,
  placeholder,
  emptyClassName = 'text-[#9CA3AF]',
  textClassName = 'text-[#374151]',
}: AboutDescriptionTextProps) {
  const [expanded, setExpanded] = useState(false);
  const paragraphs = useMemo(() => splitParagraphs(text), [text]);

  useEffect(() => {
    setExpanded(false);
  }, [text]);
  const hasContent = paragraphs.length > 0;
  const needsCollapse = paragraphs.length > COLLAPSED_PARAGRAPHS;
  const visible =
    expanded || !needsCollapse ? paragraphs : paragraphs.slice(0, COLLAPSED_PARAGRAPHS);

  if (!hasContent) {
    return (
      <p className={`whitespace-pre-wrap text-[15px] leading-[1.7] ${emptyClassName}`}>{placeholder}</p>
    );
  }

  return (
    <div>
      <div className={`space-y-3 text-[15px] leading-[1.7] ${textClassName}`}>
        {visible.map((paragraph, index) => (
          <p key={index} className="whitespace-pre-wrap">
            {paragraph}
          </p>
        ))}
      </div>
      {needsCollapse ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-[13px] font-semibold text-[#ff5f7a] transition hover:text-[#ff6f88]"
        >
          {expanded ? 'Свернуть' : 'Показать полностью'}
        </button>
      ) : null}
    </div>
  );
}
