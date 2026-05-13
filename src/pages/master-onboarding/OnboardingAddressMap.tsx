import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCallback, useEffect, useRef, useState } from 'react';

const MINSK_CENTER: L.LatLngExpression = [53.9025, 27.5615];
const DEFAULT_ZOOM = 12;

const OSM_TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

export type MapPickResult = {
  addressLine: string;
  lat: number;
  lng: number;
};

type NominatimAddress = {
  road?: string;
  pedestrian?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  house_number?: string;
  state?: string;
  country?: string;
};

type NominatimHit = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
};

/** Короткая строка для формы из ответа Nominatim. */
export function nominatimLineForForm(hit: NominatimHit): string {
  const a = hit.address;
  if (a?.road && a.house_number) return `${a.road}, ${a.house_number}`;
  if (a?.pedestrian && a.house_number) return `${a.pedestrian}, ${a.house_number}`;
  if (a?.road) return a.road;
  if (a?.pedestrian) return a.pedestrian;
  const parts = hit.display_name.split(',').map((s) => s.trim());
  return parts.slice(0, 2).join(', ') || 'Точка на карте';
}

/** Разбор строки «улица, дом» в поля формы (fallback). */
export function splitReferenceLabelToStreetBuilding(label: string): { street: string; building: string } {
  const t = label.trim();
  const m = t.match(/^(.+?),\s*([^,]{1,40})\s*$/);
  if (m && m[1].trim() && m[2].trim()) {
    return { street: m[1].trim(), building: m[2].trim() };
  }
  return { street: t, building: 'б/н' };
}

function yandexMapsPointUrl(lat: number, lng: number): string {
  const ll = `${lng},${lat}`;
  return `https://yandex.ru/maps/?ll=${encodeURIComponent(ll)}&z=16&pt=${encodeURIComponent(ll)},pm2rdm`;
}

async function nominatimSearch(q: string, signal: AbortSignal): Promise<NominatimHit[]> {
  const url = new URL(NOMINATIM_SEARCH);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('q', q);
  url.searchParams.set('limit', '10');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('countrycodes', 'by');
  /** Приоритет окрестности Минска (не жёсткая граница). */
  url.searchParams.set('viewbox', '27.38,53.95,27.72,53.82');
  url.searchParams.set('bounded', '0');

  const res = await fetch(url.toString(), {
    signal,
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'ru',
    },
  });
  if (!res.ok) throw new Error(`nominatim ${res.status}`);
  const data = (await res.json()) as unknown;
  return Array.isArray(data) ? (data as NominatimHit[]) : [];
}

async function nominatimReverse(lat: number, lon: number, signal: AbortSignal): Promise<NominatimHit | null> {
  const url = new URL(NOMINATIM_REVERSE);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('addressdetails', '1');

  const res = await fetch(url.toString(), {
    signal,
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'ru',
    },
  });
  if (!res.ok) throw new Error(`nominatim reverse ${res.status}`);
  const data = (await res.json()) as NominatimHit & { error?: string };
  if (data?.error) return null;
  return data;
}

type Props = {
  city: string;
  addressLine: string;
  onPick: (res: MapPickResult) => void;
  visitType?: 'studio' | 'at_home';
  coordsError?: string;
};

export function OnboardingAddressMap({ city, addressLine, onPick, visitType = 'studio', coordsError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NominatimHit[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortSearchRef = useRef<AbortController | null>(null);
  const abortReverseRef = useRef<AbortController | null>(null);

  const applyPick = useCallback((lat: number, lng: number, line: string) => {
    const map = mapRef.current;
    if (map) {
      map.setView([lat, lng], 16, { animate: true });
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      const m = L.circleMarker([lat, lng], {
        radius: 9,
        color: '#ffffff',
        weight: 2,
        fillColor: '#E29595',
        fillOpacity: 1,
      }).addTo(map);
      markerRef.current = m;
    }
    setPicked({ lat, lng });
    onPickRef.current({ addressLine: line, lat, lng });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      zoomControl: true,
      attributionControl: true,
    }).setView(MINSK_CENTER, DEFAULT_ZOOM);

    L.tileLayer(OSM_TILE, { attribution: OSM_ATTR, maxZoom: 19 }).addTo(map);
    mapRef.current = map;
    setMapReady(true);

    const onMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (abortReverseRef.current) abortReverseRef.current.abort();
      const ac = new AbortController();
      abortReverseRef.current = ac;
      void nominatimReverse(lat, lng, ac.signal)
        .then((hit) => {
          const line = hit ? nominatimLineForForm(hit) : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          applyPick(lat, lng, line);
          setHint(null);
        })
        .catch((err: unknown) => {
          if ((err as { name?: string }).name === 'AbortError') return;
          console.warn('[SLOTTY] reverse geocode', err);
          applyPick(lat, lng, `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        });
    };
    map.on('click', onMapClick);

    const t = window.setTimeout(() => map.invalidateSize(), 200);
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
    });
    ro.observe(el);

    return () => {
      window.clearTimeout(t);
      ro.disconnect();
      map.off('click', onMapClick);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      setMapReady(false);
    };
  }, [applyPick]);

  const runSearch = useCallback(
    async (raw: string) => {
      const q = raw.trim();
      if (q.length < 2) {
        setItems([]);
        setHint(null);
        return;
      }
      const cityPart = city.trim() || 'Минск';
      const fullQ = `${cityPart}, ${q}`;

      if (abortSearchRef.current) abortSearchRef.current.abort();
      const ac = new AbortController();
      abortSearchRef.current = ac;

      setLoading(true);
      setHint(null);
      try {
        const list = await nominatimSearch(fullQ, ac.signal);
        setItems(list);
        setOpen(list.length > 0);
        if (list.length === 0) {
          setHint('Ничего не нашли — уточните запрос или кликните по карте.');
        }
      } catch (err: unknown) {
        if ((err as { name?: string }).name === 'AbortError') return;
        console.warn('[SLOTTY] nominatim search', err);
        setItems([]);
        setHint('Поиск временно недоступен. Попробуйте позже или укажите адрес вручную ниже.');
      } finally {
        setLoading(false);
      }
    },
    [city],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setItems([]);
      setOpen(false);
      setHint(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      void runSearch(query);
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (!el || !(e.target instanceof Node)) return;
      if (!el.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const onSelectHit = (hit: NominatimHit) => {
    const lat = Number.parseFloat(hit.lat);
    const lng = Number.parseFloat(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const line = nominatimLineForForm(hit);
    setQuery(line);
    setOpen(false);
    applyPick(lat, lng, line);
    setHint(null);
  };

  return (
    <div className="space-y-2">
      <p className="text-[12px] leading-snug text-neutral-500">
        {visitType === 'at_home'
          ? 'Как на картах: введите адрес или район — список подсказок; можно кликнуть по карте, чтобы поставить метку.'
          : 'Поиск по OpenStreetMap (Беларусь): подсказки в списке, метка на карте — координаты сохраняются для клиентов.'}
      </p>

      <div ref={wrapRef} className="relative z-[120]">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (items.length > 0) setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
              if (e.key === 'Enter') {
                e.preventDefault();
                void runSearch(query);
                setOpen(true);
              }
            }}
            placeholder="Улица, дом, ТЦ, метро…"
            autoComplete="off"
            className="min-h-11 min-w-0 flex-1 rounded-full bg-[#F1EFEF] px-4 text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400"
          />
          <button
            type="button"
            onClick={() => {
              void runSearch(query);
              setOpen(true);
            }}
            className="shrink-0 rounded-full bg-[#E29595] px-4 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(226,149,149,0.25)] transition active:scale-[0.97]"
          >
            {loading ? '…' : 'Найти'}
          </button>
        </div>

        {open && items.length > 0 ? (
          <ul
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-[130] max-h-[min(220px,38dvh)] overflow-auto rounded-[18px] border border-neutral-200 bg-white py-1 shadow-[0_12px_40px_rgba(17,17,17,0.1)]"
            role="listbox"
          >
            {items.map((hit) => (
              <li key={hit.place_id}>
                <button
                  type="button"
                  role="option"
                  className="flex w-full px-3 py-2.5 text-left text-[13px] leading-snug text-neutral-900 transition hover:bg-[#F1EFEF] active:bg-[#EAE8E8]"
                  onClick={() => onSelectHit(hit)}
                >
                  <span className="line-clamp-2">{hit.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {hint ? <p className="text-[12px] leading-snug text-[#B66A24]">{hint}</p> : null}
      {coordsError ? <p className="text-[12px] leading-snug text-[#B66A24]">{coordsError}</p> : null}

      <div
        ref={containerRef}
        className={`relative z-0 h-[min(260px,45dvh)] w-full min-h-[200px] overflow-hidden rounded-[22px] bg-[#E8E6E6] ${
          mapReady ? '' : 'animate-pulse'
        }`}
      />

      {addressLine ? (
        <p className="text-[13px] font-medium text-neutral-700">
          Выбрано: <span className="text-neutral-900">{addressLine}</span>
        </p>
      ) : null}

      {picked && Number.isFinite(picked.lat) && Number.isFinite(picked.lng) ? (
        <div className="rounded-[22px] border border-neutral-200 bg-neutral-50 px-3 py-3 text-[13px] text-neutral-700">
          <p className="font-semibold text-neutral-900">Метка на карте</p>
          <p className="mt-1 tabular-nums text-neutral-600">
            {picked.lat.toFixed(5)}, {picked.lng.toFixed(5)}
          </p>
          <a
            href={yandexMapsPointUrl(picked.lat, picked.lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex text-[13px] font-semibold text-[#E29595] underline-offset-2 hover:underline"
          >
            Открыть в Яндекс.Картах
          </a>
        </div>
      ) : null}
    </div>
  );
}
