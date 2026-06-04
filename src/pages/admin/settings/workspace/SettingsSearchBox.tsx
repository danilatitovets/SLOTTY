import { useEffect, useRef } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SettingsSearchBox({ value, onChange, placeholder = 'Поиск настроек' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="relative px-3 pb-2 pt-1">
      <svg
        className="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden
      >
        <circle cx="11" cy="11" r="8" strokeWidth="1.75" />
        <path d="m21 21-4.35-4.35" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[12px] border-0 bg-[#F5F5F5] py-2.5 pl-10 pr-3 text-[14px] text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:bg-[#EBEBEB]"
        aria-label={placeholder}
      />
    </div>
  );
}
