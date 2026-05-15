import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import { cropImageToAspect, type PhotoFrameFocus } from '../lib/cropImageToAspect';

const HERO_ASPECT = 16 / 10;
const ZOOM_MIN = 1;
const ZOOM_MAX = 5;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

type Props = {
  src: string;
  aspect?: number;
  initialFocus?: PhotoFrameFocus;
  onApply: (croppedDataUrl: string) => void | Promise<void>;
  onCancel: () => void;
};

export function ProfilePhotoAdjust({
  src,
  aspect = HERO_ASPECT,
  initialFocus,
  onApply,
  onCancel,
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const lastPtrRef = useRef<{ x: number; y: number } | null>(null);
  const dragActiveRef = useRef(false);

  const [focus, setFocus] = useState<PhotoFrameFocus>(
    () => ({
      x: initialFocus?.x ?? 0.5,
      y: initialFocus?.y ?? 0.5,
      zoom: clamp(initialFocus?.zoom ?? 1, ZOOM_MIN, ZOOM_MAX),
    }),
  );
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aspectPercent = useMemo(() => `${(1 / aspect) * 100}%`, [aspect]);

  const previewStyle = useMemo(() => {
    const z = focus.zoom;
    const px = (0.5 - focus.x) * 40 * z;
    const py = (0.5 - focus.y) * 40 * z;
    return {
      transform: `translate(${px}%, ${py}%) scale(${z})`,
    } as const;
  }, [focus]);

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    lastPtrRef.current = { x: e.clientX, y: e.clientY };
    dragActiveRef.current = true;
    setError(null);
  }, []);

  const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const el = frameRef.current;
    if (!el || !lastPtrRef.current || !dragActiveRef.current) return;
    if (e.pointerType === 'touch' && e.isPrimary === false) return;

    const rect = el.getBoundingClientRect();
    const last = lastPtrRef.current;
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    lastPtrRef.current = { x: e.clientX, y: e.clientY };

    setFocus((prev) => {
      const sens = 0.42 / Math.max(0.85, prev.zoom);
      return {
        ...prev,
        x: clamp(prev.x - (dx / rect.width) * sens, 0, 1),
        y: clamp(prev.y - (dy / rect.height) * sens, 0, 1),
      };
    });
  }, []);

  const endDrag = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    lastPtrRef.current = null;
    dragActiveRef.current = false;
  }, []);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const wheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const delta = -ev.deltaY * 0.0025;
      if (Math.abs(delta) < 0.0001) return;
      setFocus((prev) => ({
        ...prev,
        zoom: clamp(prev.zoom + delta * Math.max(1, prev.zoom * 0.35), ZOOM_MIN, ZOOM_MAX),
      }));
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, []);

  const apply = async () => {
    setApplying(true);
    setError(null);
    try {
      const out = await cropImageToAspect(src, aspect, focus);
      await onApply(out);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось обработать фото');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-[13px] leading-snug text-neutral-500">
        Сдвигайте кадр перетаскиванием, масштаб — колёсиком мыши или ползунком (как в редакторе: сдвиг + приближение).
      </p>

      <div
        ref={frameRef}
        className="relative mx-auto w-full max-w-[360px] cursor-grab overflow-hidden rounded-[22px] bg-neutral-900 shadow-[0_12px_36px_rgba(17,17,17,0.18)] touch-none active:cursor-grabbing"
        style={{ paddingBottom: aspectPercent }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="img"
        aria-label="Настройка кадра фото"
      >
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={src}
            alt=""
            draggable={false}
            className="pointer-events-none absolute left-1/2 top-1/2 h-full w-full min-h-full min-w-full max-w-none object-cover select-none"
            style={previewStyle}
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0 rounded-[22px] ring-2 ring-inset ring-white/25"
          aria-hidden
        />
      </div>

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Приближение</span>
        <input
          type="range"
          min={ZOOM_MIN}
          max={ZOOM_MAX}
          step={0.02}
          value={focus.zoom}
          onChange={(e) =>
            setFocus((prev) => ({ ...prev, zoom: Number(e.target.value) }))
          }
          className="mt-2 w-full accent-[#E29595]"
        />
      </label>

      {error ? <p className="text-[12px] font-medium text-red-600">{error}</p> : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onCancel}
          disabled={applying}
          className="min-h-11 flex-1 rounded-full bg-[#F1EFEF] px-4 text-[14px] font-semibold text-neutral-800 transition active:scale-[0.98] disabled:opacity-50"
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={() => void apply()}
          disabled={applying}
          className="min-h-11 flex-1 rounded-full bg-[#E29595] px-4 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(226,149,149,0.28)] transition active:scale-[0.98] disabled:opacity-50"
        >
          {applying ? 'Сохраняем…' : 'Применить кадр'}
        </button>
      </div>
    </div>
  );
}
