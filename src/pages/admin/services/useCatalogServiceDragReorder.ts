import { useCallback, useEffect, useRef, useState } from 'react';

type Options = {
  enabled: boolean;
  onReorder: (activeId: string, overId: string) => void;
};

export function useCatalogServiceDragReorder({ enabled, onReorder }: Options) {
  const draggingIdRef = useRef<string | null>(null);
  const overIdRef = useRef<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const finishDrag = useCallback(() => {
    const active = draggingIdRef.current;
    const over = overIdRef.current;
    if (active && over && active !== over) {
      onReorder(active, over);
    }
    draggingIdRef.current = null;
    overIdRef.current = null;
    setDraggingId(null);
    setOverId(null);
  }, [onReorder]);

  useEffect(() => {
    if (!draggingId) return undefined;

    const onPointerMove = (event: PointerEvent) => {
      const element = document.elementFromPoint(event.clientX, event.clientY);
      const row = element?.closest<HTMLElement>('[data-catalog-service-id]');
      const id = row?.dataset.catalogServiceId;
      if (!id) return;
      overIdRef.current = id;
      setOverId(id);
    };

    const onPointerUp = () => finishDrag();

    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);

    return () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
    };
  }, [draggingId, finishDrag]);

  const onHandlePointerDown = useCallback(
    (serviceId: string, event: React.PointerEvent<HTMLButtonElement>) => {
      if (!enabled) return;
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      draggingIdRef.current = serviceId;
      overIdRef.current = serviceId;
      setDraggingId(serviceId);
      setOverId(serviceId);
    },
    [enabled],
  );

  return {
    draggingId,
    overId,
    isDragging: draggingId !== null,
    onHandlePointerDown,
  };
}
