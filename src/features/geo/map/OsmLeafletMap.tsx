import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useEffect, useRef } from 'react';

const MINSK_CENTER: L.LatLngExpression = [53.9025, 27.5615];
const DEFAULT_ZOOM = 12;
const OSM_TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

function stripLeafletAttribution(container: HTMLElement) {
  container.querySelectorAll('.leaflet-control-attribution').forEach((node) => node.remove());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconProto = L.Icon.Default.prototype as any;
if (iconProto._getIconUrl) {
  delete iconProto._getIconUrl;
}
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type Props = {
  initialLat?: number | null;
  initialLng?: number | null;
  onMapPoint: (lat: number, lng: number) => void;
  onReady?: () => void;
  onFail?: () => void;
  className?: string;
  mapClassName?: string;
  /** Zoom при выборе точки с карты или из подсказки. */
  pickZoom?: number;
};

export function OsmLeafletMap({
  initialLat,
  initialLng,
  onMapPoint,
  onReady,
  onFail,
  className = '',
  mapClassName,
  pickZoom = 16,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onMapPointRef = useRef(onMapPoint);
  /** Координаты, уже применённые к маркеру — не дёргаем маркер при том же lat/lng от родителя. */
  const appliedExternalRef = useRef<{ lat: number; lng: number } | null>(null);
  onMapPointRef.current = onMapPoint;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    let cancelled = false;

    try {
      const map = L.map(el, { zoomControl: true, attributionControl: false }).setView(
        MINSK_CENTER,
        DEFAULT_ZOOM,
      );
      L.tileLayer(OSM_TILE, { attribution: '', maxZoom: 19 }).addTo(map);
      stripLeafletAttribution(el);
      map.whenReady(() => stripLeafletAttribution(el));

      const marker = L.marker(MINSK_CENTER, { draggable: true }).addTo(map);
      mapRef.current = map;
      markerRef.current = marker;

      const emitPoint = (lat: number, lng: number) => {
        onMapPointRef.current(lat, lng);
      };

      const focusPoint = (lat: number, lng: number) => {
        marker.setLatLng([lat, lng]);
        map.setView([lat, lng], Math.max(map.getZoom(), pickZoom), { animate: true });
      };

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        focusPoint(pos.lat, pos.lng);
        emitPoint(pos.lat, pos.lng);
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        focusPoint(e.latlng.lat, e.latlng.lng);
        emitPoint(e.latlng.lat, e.latlng.lng);
      });

      const hasInitial =
        initialLat != null &&
        initialLng != null &&
        Number.isFinite(initialLat) &&
        Number.isFinite(initialLng);

      if (hasInitial) {
        marker.setLatLng([initialLat, initialLng]);
        map.setView([initialLat, initialLng], Math.max(map.getZoom(), pickZoom), { animate: false });
        appliedExternalRef.current = { lat: initialLat, lng: initialLng };
      }

      const t = window.setTimeout(() => map.invalidateSize(), 200);
      const ro = new ResizeObserver(() => map.invalidateSize());

      ro.observe(el);

      if (!cancelled) onReady?.();

      return () => {
        cancelled = true;
        window.clearTimeout(t);
        ro.disconnect();
        map.off();
        map.remove();
        mapRef.current = null;
        markerRef.current = null;
      };
    } catch (err) {
      console.warn('[SLOTTY] OSM map init failed:', err);
      onFail?.();
      return undefined;
    }
  }, [initialLat, initialLng, onFail, onReady, pickZoom]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    const hasInitial =
      initialLat != null &&
      initialLng != null &&
      Number.isFinite(initialLat) &&
      Number.isFinite(initialLng);

    if (!hasInitial) return;

    const prev = appliedExternalRef.current;
    if (prev && Math.abs(prev.lat - initialLat) < 1e-7 && Math.abs(prev.lng - initialLng) < 1e-7) {
      return;
    }

    const current = marker.getLatLng();
    if (
      Math.abs(current.lat - initialLat) < 1e-7 &&
      Math.abs(current.lng - initialLng) < 1e-7
    ) {
      appliedExternalRef.current = { lat: initialLat, lng: initialLng };
      return;
    }

    marker.setLatLng([initialLat, initialLng]);
    map.setView([initialLat, initialLng], Math.max(map.getZoom(), pickZoom), { animate: false });
    appliedExternalRef.current = { lat: initialLat, lng: initialLng };
  }, [initialLat, initialLng, pickZoom]);

  const canvasClass =
    mapClassName ??
    'relative z-0 h-[min(220px,42dvh)] min-h-[200px] w-full overflow-hidden rounded-[18px] bg-[#E4E2E2] sm:h-[min(240px,36dvh)]';

  return (
    <div className="slotty-osm-map">
      <div ref={containerRef} className={`slotty-osm-map__canvas ${canvasClass} ${className}`} />
      <p className="sr-only">
        Карта:{' '}
        <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>
      </p>
    </div>
  );
}
