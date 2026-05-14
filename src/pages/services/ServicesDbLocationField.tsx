import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { fetchLocationSuggestions, type LocationSuggestionDto } from '../../features/services/api/catalogListingsApi';
import {
  nominatimLineForForm,
  nominatimSearchMinsk,
  type NominatimMinskHit,
} from '../../shared/lib/nominatimMinsk';
import {
  computeViewportListPlacement,
  type ViewportListPlacement,
} from '../../shared/lib/viewportListPlacement';

type Props = {
  locationId: string | null;
  addressLine: string;
  onChange: (next: { locationId: string | null; addressLine: string }) => void;
  id?: string;
  /**
   * Список в `document.body` с position:fixed — внутри модалки с overflow-y-auto,
   * иначе выпадающий список обрезается или перекрывается некорректно.
   */
  viewportDropdown?: boolean;
};

function nominatimToSuggestions(hits: NominatimMinskHit[]): LocationSuggestionDto[] {
  return hits.map((hit) => ({
    id: `nom:${hit.place_id}`,
    type: 'address',
    title: nominatimLineForForm(hit),
    subtitle: hit.display_name.length > 90 ? `${hit.display_name.slice(0, 87)}…` : hit.display_name,
  }));
}

/** Убираем дубли с одинаковой короткой строкой (разные POI на одном доме). */
function dedupeByTitle(items: LocationSuggestionDto[]): LocationSuggestionDto[] {
  const seen = new Set<string>();
  const out: LocationSuggestionDto[] = [];
  for (const it of items) {
    const k = it.title.trim().toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

/** Подсказки: каталог мастеров, при пустом ответе или ошибке — Nominatim по Минску. */
export function ServicesDbLocationField({ locationId, addressLine, onChange, id, viewportDropdown = false }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LocationSuggestionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [dropPlacement, setDropPlacement] = useState<ViewportListPlacement | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runSuggest = useCallback(async (raw: string) => {
    const q = raw.trim();
    if (q.length < 1) {
      setItems([]);
      setOpen(false);
      setHint(null);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setHint(null);

    try {
      let catalogList: LocationSuggestionDto[] = [];
      try {
        catalogList = await fetchLocationSuggestions(q, 12);
      } catch {
        catalogList = [];
      }
      if (ac.signal.aborted) return;

      if (catalogList.length > 0) {
        setItems(catalogList);
        setOpen(true);
        setHint(null);
        return;
      }

      const nom = await nominatimSearchMinsk('Минск', q, ac.signal);
      if (ac.signal.aborted) return;
      const list = dedupeByTitle(nominatimToSuggestions(nom));
      setItems(list);
      setOpen(list.length > 0);
      setHint(list.length === 0 ? 'Ничего не нашли. Уточните улицу, дом или район в Минске.' : null);
    } catch (err: unknown) {
      if ((err as { name?: string }).name === 'AbortError') return;
      console.warn('[SLOTTY] location suggest / nominatim', err);
      setItems([]);
      setOpen(false);
      setHint('Не удалось загрузить подсказки');
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    if (locationId) {
      setItems([]);
      setOpen(false);
      setHint(null);
      return;
    }
    if (addressLine.trim().length < 1) {
      setItems([]);
      setOpen(false);
      setHint(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      void runSuggest(addressLine);
    }, 400);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [addressLine, locationId, runSuggest]);

  useLayoutEffect(() => {
    if (!viewportDropdown || !open || items.length === 0) {
      setDropPlacement(null);
      return;
    }
    const input = wrapRef.current?.querySelector('input');
    if (!input) {
      setDropPlacement(null);
      return;
    }
    const measure = () => {
      setDropPlacement(computeViewportListPlacement(input));
    };
    measure();
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', measure);
      window.visualViewport.addEventListener('scroll', measure);
    }
    return () => {
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', measure);
        window.visualViewport.removeEventListener('scroll', measure);
      }
    };
  }, [viewportDropdown, open, items]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      const inWrap = wrapRef.current?.contains(t);
      const inList = listRef.current?.contains(t);
      if (!inWrap && !inList) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const clear = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    onChange({ locationId: null, addressLine: '' });
    setItems([]);
    setOpen(false);
    setHint(null);
  };

  const onSelectHit = (hit: LocationSuggestionDto) => {
    onChange({ locationId: hit.id.startsWith('nom:') ? null : hit.id, addressLine: hit.title });
    setOpen(false);
    setHint(null);
    setItems([]);
  };

  const listClassPortal = 'scrollbar-hidden overflow-y-auto rounded-[18px] bg-white py-1 shadow-[0_12px_40px_rgba(17,17,17,0.12)]';
  const listClassInline =
    'scrollbar-hidden max-h-[min(220px,38dvh)] overflow-auto rounded-[18px] bg-white py-1 shadow-[0_12px_40px_rgba(17,17,17,0.12)]';

  const listBody = items.map((hit) => (
    <li key={hit.id}>
      <button
        type="button"
        role="option"
        className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition hover:bg-neutral-50 active:bg-[#EAE8E8]"
        onClick={() => onSelectHit(hit)}
      >
        <span className="text-[14px] font-semibold text-neutral-900">{hit.title}</span>
        <span className="text-[12px] text-neutral-500">{hit.subtitle}</span>
      </button>
    </li>
  ));

  const portalListStyle: CSSProperties | null =
    dropPlacement && viewportDropdown && open && items.length > 0
      ? dropPlacement.mode === 'down'
        ? {
            position: 'fixed',
            top: dropPlacement.top,
            left: dropPlacement.left,
            width: dropPlacement.width,
            maxHeight: dropPlacement.maxHeight,
            zIndex: 10000,
          }
        : {
            position: 'fixed',
            bottom: dropPlacement.bottom,
            left: dropPlacement.left,
            width: dropPlacement.width,
            maxHeight: dropPlacement.maxHeight,
            zIndex: 10000,
          }
      : null;

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-stretch gap-2">
        <input
          id={id}
          type="text"
          value={addressLine}
          onChange={(e) => onChange({ locationId: null, addressLine: e.target.value })}
          onFocus={() => {
            if (items.length > 0) setOpen(true);
            else if (!locationId && addressLine.trim().length >= 1) void runSuggest(addressLine);
          }}
          placeholder="Достаточно одной буквы — например, Немига"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-[24px] bg-[#F1EFEF] px-4 py-3.5 text-[16px] font-semibold text-neutral-950 outline-none ring-0 placeholder:font-medium placeholder:text-neutral-400"
        />
        {locationId || addressLine.trim() ? (
          <button
            type="button"
            onClick={clear}
            className="shrink-0 rounded-[24px] bg-[#F1EFEF] px-3 text-[13px] font-semibold text-neutral-600 transition hover:bg-neutral-200/80 active:scale-[0.98]"
          >
            Сброс
          </button>
        ) : null}
      </div>

      {locationId ? (
        <p className="mt-1.5 text-[12px] text-neutral-500">Выбран адрес из каталога — точная локация.</p>
      ) : null}

      {open && items.length > 0 ? (
        viewportDropdown && portalListStyle ? (
          createPortal(
            <ul ref={listRef} role="listbox" className={listClassPortal} style={portalListStyle}>
              {listBody}
            </ul>,
            document.body,
          )
        ) : !viewportDropdown ? (
          <ul
            ref={listRef}
            className={`absolute left-0 right-0 top-[calc(100%+6px)] z-10 ${listClassInline}`}
            role="listbox"
          >
            {listBody}
          </ul>
        ) : null
      ) : null}

      {hint ? <p className="mt-2 text-[12px] leading-snug text-[#B66A24]">{hint}</p> : null}
      {loading ? <p className="mt-1.5 text-[12px] text-neutral-400">Загрузка…</p> : null}
    </div>
  );
}
