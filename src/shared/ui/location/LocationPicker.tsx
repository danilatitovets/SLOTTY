import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import { HiQuestionMarkCircle } from 'react-icons/hi2';

import { OsmLeafletMap } from '../../../features/geo/map/OsmLeafletMap';
import { resolveMapProvider } from '../../../features/geo/map/mapProvider';
import { dedupeNormalizedSuggestions } from '../../lib/location/normalizeNominatimAddress';
import {
  reverseGeocode,
  searchAddress,
  type NormalizedAddressSuggestion,
} from '../../lib/location/nominatimGeocode';
import { makeYandexMapsRouteUrl } from '../../lib/yandexMapsExternal';
import { subscribeTelegramViewportLayout } from '../../lib/telegramWebApp';
import {
  computeViewportListPlacement,
  type ViewportListPlacement,
} from '../../lib/viewportListPlacement';

export type LocationPickerValue = {
  address: string;
  latitude: number;
  longitude: number;
};

export type LocationPickerProps = {
  label?: string;
  helpText?: string;
  value: string;
  latitude?: number | null;
  longitude?: number | null;
  city?: string;
  onChange: (next: LocationPickerValue) => void;
  onInputChange?: (address: string) => void;
  /** Адрес с карты / reverse-geocode — без сброса «привязки» в форме. */
  onAddressResolved?: (address: string) => void;
  placeholder?: string;
  error?: string;
  coordsError?: string;
  inputClassName?: string;
  showRouteLink?: boolean;
  /** Скрыть блок карты (только поле и подсказки). */
  showMap?: boolean;
  viewportDropdown?: boolean;
  /** Подсказки в portal (поверх Leaflet). По умолчанию true. */
  portalSuggestions?: boolean;
  /** Список подсказок между полем и картой (как в эталонном UI). */
  suggestStacked?: boolean;
  suggestionsZIndex?: number;
  suppressSuggestUntilFocus?: boolean;
  addressCommitted?: boolean;
  onInputBlur?: () => void;
  inputMaxLength?: number;
  onMapAvailabilityChange?: (available: boolean) => void;
  mapClassName?: string;
  /** Статус подсказок: для показа fallback-действий снаружи. */
  onSuggestOutcomeChange?: (outcome: 'idle' | 'loading' | 'empty' | 'ready') => void;
  /** Текст «ничего не найдено» под полем. По умолчанию true. */
  showEmptySearchHint?: boolean;
};

const SEARCH_MIN_CHARS = 3;
const SEARCH_DEBOUNCE_MS = 650;
const PICK_ZOOM = 16;

const DEFAULT_INPUT_CLASS =
  'mt-1.5 w-full rounded-[20px] border border-[#E8E6E6] bg-white px-4 py-3.5 text-[16px] font-semibold text-neutral-950 shadow-[0_1px_2px_rgba(17,17,17,0.04)] outline-none ring-0 placeholder:font-medium placeholder:text-neutral-400 transition focus:border-[#E29595]/40';

export function LocationPicker({
  label = 'Точка на карте',
  helpText = 'Укажите адрес или поставьте точку на карте. Это поможет клиентам найти вас.',
  value,
  latitude = null,
  longitude = null,
  city = 'Минск',
  onChange,
  onInputChange,
  onAddressResolved,
  placeholder = 'Введите улицу и дом',
  error,
  coordsError,
  inputClassName = DEFAULT_INPUT_CLASS,
  showRouteLink = true,
  showMap = true,
  viewportDropdown = false,
  portalSuggestions = true,
  suggestStacked = false,
  suggestionsZIndex = 10000,
  suppressSuggestUntilFocus = false,
  addressCommitted = false,
  onInputBlur,
  inputMaxLength = 200,
  onMapAvailabilityChange,
  mapClassName,
  onSuggestOutcomeChange,
  showEmptySearchHint = true,
}: LocationPickerProps) {
  const helpId = useId();
  const mapProvider = resolveMapProvider();

  const [suggestArmed, setSuggestArmed] = useState(!suppressSuggestUntilFocus);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NormalizedAddressSuggestion[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [layoutTick, setLayoutTick] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);

  const inputWrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const helpBtnRef = useRef<HTMLButtonElement>(null);
  const onChangeRef = useRef(onChange);
  const onInputChangeRef = useRef(onInputChange);
  const onAddressResolvedRef = useRef(onAddressResolved);
  const onMapAvailabilityChangeRef = useRef(onMapAvailabilityChange);
  const onSuggestOutcomeChangeRef = useRef(onSuggestOutcomeChange);
  const lineRef = useRef('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortSearchRef = useRef<AbortController | null>(null);
  const reverseAbortRef = useRef<AbortController | null>(null);
  const searchCacheRef = useRef<Map<string, NormalizedAddressSuggestion[]>>(new Map());
  const suggestPausedRef = useRef(addressCommitted);
  const reverseGenRef = useRef(0);

  onChangeRef.current = onChange;
  onInputChangeRef.current = onInputChange;
  onAddressResolvedRef.current = onAddressResolved;
  onMapAvailabilityChangeRef.current = onMapAvailabilityChange;
  onSuggestOutcomeChangeRef.current = onSuggestOutcomeChange;

  const emitSuggestOutcome = useCallback(
    (outcome: 'idle' | 'loading' | 'empty' | 'ready') => {
      onSuggestOutcomeChangeRef.current?.(outcome);
    },
    [],
  );

  const hasCoords =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  useEffect(() => {
    if (value.trim()) lineRef.current = value.trim();
  }, [value]);

  const dismissSuggest = useCallback(() => {
    suggestPausedRef.current = true;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortSearchRef.current) abortSearchRef.current.abort();
    setItems([]);
    setOpen(false);
    setHint(null);
    setLoading(false);
    emitSuggestOutcome('idle');
  }, [emitSuggestOutcome]);

  useEffect(() => {
    suggestPausedRef.current = addressCommitted;
    if (!addressCommitted) return;
    dismissSuggest();
  }, [addressCommitted, dismissSuggest]);

  const emitValue = useCallback((address: string, lat: number, lng: number) => {
    lineRef.current = address;
    onChangeRef.current({ address, latitude: lat, longitude: lng });
  }, []);

  const resolveLineFromCoords = useCallback(
    async (lat: number, lng: number): Promise<string | null> => {
      if (reverseAbortRef.current) reverseAbortRef.current.abort();
      const ac = new AbortController();
      reverseAbortRef.current = ac;

      try {
        const hit = await reverseGeocode(lat, lng, ac.signal);
        if (!ac.signal.aborted && hit?.cleanAddress?.trim()) {
          return hit.cleanAddress.trim();
        }
      } catch {
        /* keep user text */
      }
      return null;
    },
    [],
  );

  const commitMapPoint = useCallback(
    (lat: number, lng: number) => {
      const gen = ++reverseGenRef.current;
      suggestPausedRef.current = true;
      dismissSuggest();

      const currentLine = lineRef.current.trim() || value.trim();
      emitValue(currentLine || 'Выбранная точка на карте', lat, lng);

      void resolveLineFromCoords(lat, lng).then((line) => {
        if (gen !== reverseGenRef.current || !line) return;
        const keepUser =
          currentLine.length >= 5 &&
          !line.toLowerCase().includes(currentLine.slice(0, 4).toLowerCase());
        if (keepUser) return;
        lineRef.current = line;
        (onAddressResolvedRef.current ?? onInputChangeRef.current)?.(line);
        emitValue(line, lat, lng);
        setHint(null);
      });
    },
    [dismissSuggest, emitValue, resolveLineFromCoords, value],
  );

  const runSearch = useCallback(
    async (raw: string) => {
      const q = raw.trim();
      if (q.length < SEARCH_MIN_CHARS) {
        setItems([]);
        setOpen(false);
        setHint(null);
        setLoading(false);
        emitSuggestOutcome('idle');
        return;
      }

      const cacheKey = `${city}:${q.toLowerCase()}`;
      const cached = searchCacheRef.current.get(cacheKey);
      if (cached) {
        const list = dedupeNormalizedSuggestions(cached);
        setItems(list);
        setOpen(list.length > 0);
        setHint(
          list.length === 0 ? 'Ничего не найдено, попробуйте уточнить адрес' : null,
        );
        setLoading(false);
        emitSuggestOutcome(list.length > 0 ? 'ready' : 'empty');
        return;
      }

      if (abortSearchRef.current) abortSearchRef.current.abort();
      const ac = new AbortController();
      abortSearchRef.current = ac;

      setLoading(true);
      setHint(null);
      emitSuggestOutcome('loading');

      try {
        const list = dedupeNormalizedSuggestions(await searchAddress(q, { city, signal: ac.signal }));
        if (ac.signal.aborted) return;

        searchCacheRef.current.set(cacheKey, list);
        setItems(list);
        setOpen(list.length > 0);
        setHint(
          list.length === 0 ? 'Ничего не найдено, попробуйте уточнить адрес' : null,
        );
        emitSuggestOutcome(list.length > 0 ? 'ready' : 'empty');
      } catch (err: unknown) {
        if ((err as { name?: string }).name === 'AbortError') return;
        setItems([]);
        setOpen(false);
        setHint(null);
        emitSuggestOutcome('empty');
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    },
    [city, emitSuggestOutcome],
  );

  const scheduleSearch = useCallback(
    (localPart: string) => {
      if (suggestPausedRef.current) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const q = localPart.trim();
      if (q.length < SEARCH_MIN_CHARS) {
        if (abortSearchRef.current) abortSearchRef.current.abort();
        setItems([]);
        setOpen(false);
        setHint(null);
        setLoading(false);
        emitSuggestOutcome('idle');
        return;
      }
      debounceRef.current = setTimeout(() => void runSearch(q), SEARCH_DEBOUNCE_MS);
    },
    [emitSuggestOutcome, runSearch],
  );

  useEffect(() => {
    if (suggestPausedRef.current) return undefined;
    if (suppressSuggestUntilFocus && !suggestArmed) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortSearchRef.current) abortSearchRef.current.abort();
      setItems([]);
      setOpen(false);
      setHint(null);
      setLoading(false);
      return undefined;
    }
    scheduleSearch(value);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, scheduleSearch, suppressSuggestUntilFocus, suggestArmed]);

  const onSelectHit = (hit: NormalizedAddressSuggestion) => {
    reverseGenRef.current += 1;
    suggestPausedRef.current = true;
    dismissSuggest();
    const address = hit.cleanAddress.trim();
    lineRef.current = address;
    (onAddressResolvedRef.current ?? onInputChangeRef.current)?.(address);
    emitValue(address, hit.latitude, hit.longitude);
  };

  const useSuggestPortal = !suggestStacked && (portalSuggestions || viewportDropdown);

  const dropPlacement: ViewportListPlacement | null = (() => {
    void layoutTick;
    if (!useSuggestPortal || !open || items.length === 0) return null;
    const input = inputWrapRef.current?.querySelector('input');
    return input instanceof HTMLElement ? computeViewportListPlacement(input) : null;
  })();

  useLayoutEffect(() => {
    if (!useSuggestPortal || !open || items.length === 0) return;
    const bump = () => setLayoutTick((n) => n + 1);
    const raf = requestAnimationFrame(bump);
    const unsubTg = subscribeTelegramViewportLayout(bump);
    window.addEventListener('scroll', bump, true);
    window.addEventListener('resize', bump);
    window.visualViewport?.addEventListener('resize', bump);
    window.visualViewport?.addEventListener('scroll', bump);
    return () => {
      cancelAnimationFrame(raf);
      unsubTg();
      window.removeEventListener('scroll', bump, true);
      window.removeEventListener('resize', bump);
      window.visualViewport?.removeEventListener('resize', bump);
      window.visualViewport?.removeEventListener('scroll', bump);
    };
  }, [useSuggestPortal, open, items.length]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (!inputWrapRef.current?.contains(t) && !listRef.current?.contains(t)) {
        setOpen(false);
      }
      if (helpBtnRef.current && !helpBtnRef.current.contains(t)) {
        setHelpOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const listClass =
    'scrollbar-hidden max-h-[min(280px,46dvh)] overflow-y-auto rounded-[18px] border border-[#ECEAEA] bg-white py-1 shadow-[0_12px_40px_rgba(17,17,17,0.1)]';

  const listContent = items.map((hit, index) => (
    <li key={`${hit.id}|${index}`}>
      <button
        type="button"
        role="option"
        className="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-[#FAF8F8] active:bg-[#F1EFEF]"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onSelectHit(hit)}
      >
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#F5F3F3] text-[#9CA3AF]">
          <span className="text-[14px] leading-none" aria-hidden>
            📍
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold leading-snug text-neutral-900">
            {hit.title}
          </span>
          {hit.subtitle ? (
            <span className="mt-0.5 block truncate text-[13px] font-medium leading-snug text-neutral-500">
              {hit.subtitle}
            </span>
          ) : null}
        </span>
      </button>
    </li>
  ));

  const portalListStyle: CSSProperties | null =
    dropPlacement && useSuggestPortal && open && items.length > 0
      ? dropPlacement.mode === 'down'
        ? {
            position: 'fixed',
            top: dropPlacement.top,
            left: dropPlacement.left,
            width: dropPlacement.width,
            maxHeight: dropPlacement.maxHeight,
            zIndex: suggestionsZIndex,
          }
        : {
            position: 'fixed',
            bottom: dropPlacement.bottom,
            left: dropPlacement.left,
            width: dropPlacement.width,
            maxHeight: dropPlacement.maxHeight,
            zIndex: suggestionsZIndex,
          }
      : null;

  const showMapBlock = showMap && mapProvider !== 'none';

  const rootGap = suggestStacked ? 'space-y-2' : 'space-y-3';

  return (
    <div className={rootGap}>
      {label.trim() ? (
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13px] font-semibold text-neutral-600">{label}</span>
        <div className="relative shrink-0">
          <button
            ref={helpBtnRef}
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition hover:bg-[#F5F3F3] hover:text-neutral-600"
            aria-describedby={helpOpen ? helpId : undefined}
            aria-label="Подсказка"
            onClick={() => setHelpOpen((v) => !v)}
          >
            <HiQuestionMarkCircle className="h-5 w-5" aria-hidden />
          </button>
          {helpOpen ? (
            <div
              id={helpId}
              role="tooltip"
              className="absolute right-0 top-[calc(100%+6px)] z-[200] w-[min(260px,calc(100vw-2rem))] rounded-[14px] border border-[#E8E6E6] bg-white px-3 py-2.5 text-[12px] font-medium leading-snug text-neutral-600 shadow-[0_8px_24px_rgba(17,17,17,0.1)]"
            >
              {helpText}
            </div>
          ) : null}
        </div>
      </div>
      ) : null}

      <div className={suggestStacked ? 'space-y-1.5' : undefined}>
      <div ref={inputWrapRef} className="relative z-20">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            reverseGenRef.current += 1;
            suggestPausedRef.current = false;
            lineRef.current = e.target.value;
            onInputChangeRef.current?.(e.target.value);
          }}
          onBlur={() => {
            onInputBlur?.();
            if (suppressSuggestUntilFocus) {
              setSuggestArmed(false);
              setOpen(false);
              setItems([]);
              setHint(null);
            }
          }}
          onFocus={() => {
            if (suppressSuggestUntilFocus) setSuggestArmed(true);
            if (!addressCommitted) suggestPausedRef.current = false;
            if (suggestPausedRef.current) return;
            if (items.length > 0) setOpen(true);
            else if (value.trim().length >= SEARCH_MIN_CHARS) void runSearch(value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
          placeholder={placeholder}
          maxLength={inputMaxLength}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className={inputClassName}
        />
        {!suggestStacked && open && items.length > 0 ? (
          useSuggestPortal && portalListStyle ? (
            createPortal(
              <ul ref={listRef} role="listbox" className={listClass} style={portalListStyle}>
                {listContent}
              </ul>,
              document.body,
            )
          ) : (
            <ul
              ref={listRef}
              role="listbox"
              className={`absolute left-0 right-0 top-[calc(100%+8px)] z-30 ${listClass}`}
            >
              {listContent}
            </ul>
          )
        ) : null}
        {error ? (
          <p className="mt-1.5 text-[12px] font-medium leading-snug text-red-600">{error}</p>
        ) : null}
      </div>

      {suggestStacked && open && items.length > 0 ? (
        <ul ref={listRef} role="listbox" className={`relative z-10 ${listClass}`}>
          {listContent}
        </ul>
      ) : null}
      </div>

      {loading && value.trim().length >= SEARCH_MIN_CHARS ? (
        <p className="text-[12px] font-medium text-neutral-500">Ищем адрес…</p>
      ) : null}
      {showEmptySearchHint && !loading && hint && value.trim().length >= SEARCH_MIN_CHARS ? (
        <p className="text-[12px] leading-snug text-[#B66A24]">{hint}</p>
      ) : null}

      {coordsError ? (
        <p className="text-[12px] leading-snug text-[#B66A24]">{coordsError}</p>
      ) : null}

      {showMapBlock ? (
        <div className="relative z-0 isolate overflow-hidden rounded-[18px] border border-[#ECEAEA] bg-white shadow-[0_1px_2px_rgba(17,17,17,0.04)]">
          {mapProvider === 'osm' || mapProvider === 'yandex' ? (
            <OsmLeafletMap
              initialLat={latitude}
              initialLng={longitude}
              pickZoom={PICK_ZOOM}
              onMapPoint={commitMapPoint}
              onReady={() => {
                setMapReady(true);
                setMapUnavailable(false);
                onMapAvailabilityChangeRef.current?.(true);
              }}
              onFail={() => {
                setMapReady(false);
                setMapUnavailable(true);
                onMapAvailabilityChangeRef.current?.(false);
              }}
              className={!mapReady && !mapUnavailable ? 'animate-pulse' : ''}
              mapClassName={
                mapClassName ??
                'slotty-osm-map__canvas--picker h-[min(300px,38dvh)] min-h-[280px] w-full sm:h-[min(380px,42vh)] sm:min-h-[360px]'
              }
            />
          ) : null}
          {mapUnavailable ? (
            <p className="px-4 py-3 text-[13px] font-medium leading-snug text-neutral-600">
              Карта временно не загрузилась. Адрес можно указать вручную.
            </p>
          ) : null}
        </div>
      ) : showMap ? (
        <p className="rounded-[18px] border border-[#ECEAEA] bg-[#FAFAFA] px-4 py-3 text-[13px] font-medium leading-snug text-neutral-600">
          Карта временно не загрузилась. Адрес можно указать вручную.
        </p>
      ) : null}

      {showMapBlock ? (
        <p className="text-[12px] font-medium leading-snug text-neutral-500">
          Если точка определилась неточно, передвиньте метку вручную.
        </p>
      ) : null}

      {showRouteLink && hasCoords ? (
        <a
          href={makeYandexMapsRouteUrl({ lat: latitude, lng: longitude, addressLine: value })}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-9 items-center rounded-full bg-[#FFF1F4] px-4 text-[13px] font-semibold text-[#E29595] transition hover:bg-[#FFE8EC]"
        >
          Построить маршрут
        </a>
      ) : null}
    </div>
  );
}
