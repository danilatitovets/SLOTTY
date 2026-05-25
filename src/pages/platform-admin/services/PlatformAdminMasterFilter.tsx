import { useCallback, useEffect, useState } from 'react';
import { getPlatformMasterPicker } from '../api/platformAdminApi';
import type { PlatformMasterPickerItem } from '../api/platformAdmin.types';
import { paFilterChip, paInput } from '../platformAdminTheme';

type Props = {
  selectedMasterId: string | null;
  selectedMasterName: string | null;
  onSelect: (master: PlatformMasterPickerItem | null) => void;
};

export function PlatformAdminMasterFilter({ selectedMasterId, selectedMasterName, onSelect }: Props) {
  const [q, setQ] = useState('');
  const [options, setOptions] = useState<PlatformMasterPickerItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (search: string) => {
    setLoading(true);
    try {
      setOptions(await getPlatformMasterPicker(search.trim() || undefined));
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(q), 250);
    return () => clearTimeout(t);
  }, [q, load]);

  useEffect(() => {
    void load('');
  }, [load]);

  return (
    <div className="space-y-3">
      <p className="text-[12px] font-bold uppercase tracking-wide text-[#9CA3AF]">Мастер</p>
      <input
        className={paInput}
        placeholder="Найти мастера по имени"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={paFilterChip(!selectedMasterId)}
          onClick={() => onSelect(null)}
        >
          Все мастера
        </button>
        {selectedMasterId && selectedMasterName ? (
          <span className={paFilterChip(true)}>{selectedMasterName}</span>
        ) : null}
      </div>
      {loading ? <p className="text-[13px] text-[#9CA3AF]">Поиск…</p> : null}
      {!loading && q.trim() && options.length > 0 ? (
        <ul className="max-h-48 space-y-1 overflow-y-auto rounded-2xl border border-[#eef0f5] bg-white p-2">
          {options.map((m) => (
            <li key={m.masterId}>
              <button
                type="button"
                className="w-full rounded-xl px-3 py-2 text-left text-[14px] font-semibold text-[#111827] hover:bg-[#f6f7fb]"
                onClick={() => {
                  onSelect(m);
                  setQ('');
                }}
              >
                {m.displayName}{' '}
                <span className="font-normal text-[#9CA3AF]">
                  · {m.planCode === 'pro' ? 'Pro' : 'Free'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
