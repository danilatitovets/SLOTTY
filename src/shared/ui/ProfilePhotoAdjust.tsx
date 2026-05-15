import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import {
  clampFocusToImageBounds,
  computeCropRect,
  cropImageToAspect,
  loadImageForCrop,
  type PhotoFrameFocus,
} from '../lib/cropImageToAspect';

const HERO_ASPECT = 16 / 10;
const ZOOM_MIN = 1;
const ZOOM_MAX = 5;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

type NaturalSize = { w: number; h: number };

/** Уголки рамки кадра (как в референсе), внутри скруглённого прямоугольника. */
function CropCornerBrackets({ radiusClass }: { radiusClass: string }) {
  const arm = 22;
  const stroke = 'border-[2.5px] border-white';
  const common = `pointer-events-none absolute ${stroke} opacity-[0.92]`;
  return (
    <>
      <div
        className={`${common} left-3 top-3 rounded-tl-[10px] border-r-0 border-b-0`}
        style={{ width: arm, height: arm }}
        aria-hidden
      />
      <div
        className={`${common} right-3 top-3 rounded-tr-[10px] border-b-0 border-l-0`}
        style={{ width: arm, height: arm }}
        aria-hidden
      />
      <div
        className={`${common} bottom-3 left-3 rounded-bl-[10px] border-t-0 border-r-0`}
        style={{ width: arm, height: arm }}
        aria-hidden
      />
      <div
        className={`${common} bottom-3 right-3 rounded-br-[10px] border-l-0 border-t-0`}
        style={{ width: arm, height: arm }}
        aria-hidden
      />
      <div className={`pointer-events-none absolute inset-0 ${radiusClass} ring-1 ring-inset ring-white/20`} aria-hidden />
    </>
  );
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
  const viewportRef = useRef<HTMLDivElement>(null);
  const lastPtrRef = useRef<{ x: number; y: number } | null>(null);
  const dragActiveRef = useRef(false);

  const [focus, setFocus] = useState<PhotoFrameFocus>(() => ({
    x: initialFocus?.x ?? 0.5,
    y: initialFocus?.y ?? 0.5,
    zoom: clamp(initialFocus?.zoom ?? 1, ZOOM_MIN, ZOOM_MAX),
  }));
  const [natural, setNatural] = useState<NaturalSize | null>(null);
  const [viewPx, setViewPx] = useState({ w: 0 });
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aspectPercent = useMemo(() => `${(1 / aspect) * 100}%`, [aspect]);

  useEffect(() => {
    let cancelled = false;
    setNatural(null);
    void loadImageForCrop(src)
      .then((img) => {
        if (cancelled) return;
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) return;
        setNatural({ w, h });
      })
      .catch(() => {
        if (!cancelled) setNatural(null);
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    if (!natural) return;
    setFocus((prev) => clampFocusToImageBounds(natural.w, natural.h, aspect, prev));
  }, [natural, aspect]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      const w = Math.round(cr.width);
      if (w > 0 && cr.height > 0) setViewPx({ w });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const imgLayoutStyle = useMemo(() => {
    if (!natural || viewPx.w < 2) return undefined;
    const f = clampFocusToImageBounds(natural.w, natural.h, aspect, focus);
    const { sx, sy, cropW } = computeCropRect(natural.w, natural.h, aspect, f);
    if (cropW < 1e-6) return undefined;
    const k = viewPx.w / cropW;
    return {
      position: 'absolute' as const,
      left: -sx * k,
      top: -sy * k,
      width: natural.w * k,
      height: natural.h * k,
    };
  }, [natural, viewPx.w, aspect, focus]);

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    lastPtrRef.current = { x: e.clientX, y: e.clientY };
    dragActiveRef.current = true;
    setError(null);
  }, []);

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const el = viewportRef.current;
      if (!el || !natural || !lastPtrRef.current || !dragActiveRef.current) return;
      if (e.pointerType === 'touch' && e.isPrimary === false) return;

      const rect = el.getBoundingClientRect();
      const cw = rect.width;
      if (cw < 2) return;

      const last = lastPtrRef.current;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      lastPtrRef.current = { x: e.clientX, y: e.clientY };

      const { w: W, h: H } = natural;
      setFocus((prev) => {
        const { cropW } = computeCropRect(W, H, aspect, prev);
        if (cropW < 1e-6) return prev;
        const k = cw / cropW;
        const next: PhotoFrameFocus = {
          ...prev,
          x: prev.x - dx / k / W,
          y: prev.y - dy / k / H,
        };
        return clampFocusToImageBounds(W, H, aspect, next);
      });
    },
    [natural, aspect],
  );

  const endDrag = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    lastPtrRef.current = null;
    dragActiveRef.current = false;
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el || !natural) return;
    const wheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const delta = -ev.deltaY * 0.0025;
      if (Math.abs(delta) < 0.0001) return;
      setFocus((prev) => {
        const z = clamp(prev.zoom + delta * Math.max(1, prev.zoom * 0.35), ZOOM_MIN, ZOOM_MAX);
        return clampFocusToImageBounds(natural.w, natural.h, aspect, { ...prev, zoom: z });
      });
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, [natural, aspect]);

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

  const radiusFrame = 'rounded-[22px]';

  return (
    <div className="space-y-4">
      <p className="text-[13px] leading-snug text-neutral-500">
        Перетаскивайте фото под рамкой: видно ровно тот кадр, что попадёт в профиль. Масштаб — колёсиком мыши или ползунком.
      </p>

      <div
        className={`relative mx-auto w-full max-w-[360px] cursor-grab overflow-hidden ${radiusFrame} bg-neutral-900 shadow-[0_12px_36px_rgba(17,17,17,0.18)] touch-none active:cursor-grabbing`}
        style={{ paddingBottom: aspectPercent }}
        role="img"
        aria-label="Настройка кадра фото"
      >
        <div
          ref={viewportRef}
          className={`absolute inset-0 overflow-hidden ${radiusFrame}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {!natural || !imgLayoutStyle ? (
            <div className={`absolute inset-0 animate-pulse bg-neutral-800 ${radiusFrame}`} />
          ) : (
            <img
              src={src}
              alt=""
              draggable={false}
              className="pointer-events-none select-none"
              style={imgLayoutStyle}
            />
          )}
          <CropCornerBrackets radiusClass={radiusFrame} />
        </div>
      </div>

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Приближение</span>
        <input
          type="range"
          min={ZOOM_MIN}
          max={ZOOM_MAX}
          step={0.02}
          value={focus.zoom}
          onChange={(e) => {
            const z = Number(e.target.value);
            if (!natural) {
              setFocus((prev) => ({ ...prev, zoom: clamp(z, ZOOM_MIN, ZOOM_MAX) }));
              return;
            }
            setFocus((prev) =>
              clampFocusToImageBounds(natural.w, natural.h, aspect, { ...prev, zoom: clamp(z, ZOOM_MIN, ZOOM_MAX) }),
            );
          }}
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
          disabled={applying || !natural}
          className="min-h-11 flex-1 rounded-full bg-[#E29595] px-4 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(226,149,149,0.28)] transition active:scale-[0.98] disabled:opacity-50"
        >
          {applying ? 'Сохраняем…' : 'Применить кадр'}
        </button>
      </div>
    </div>
  );
}
