import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  type ReactNode,
} from 'react';

type RegisterFn = (node: ReactNode) => () => void;

const AdminSheetFooterSlotContext = createContext<RegisterFn | null>(null);

/** Пробрасывает футер формы в `footer` у `AdminBottomSheet` (фиксированный низ модалки). */
export function AdminSheetFooterSlotProvider({
  onSlotChange,
  children,
}: {
  onSlotChange: (node: ReactNode) => void;
  children: ReactNode;
}) {
  const register = useCallback<RegisterFn>(
    (node) => {
      onSlotChange(node);
      return () => onSlotChange(null);
    },
    [onSlotChange],
  );

  return (
    <AdminSheetFooterSlotContext.Provider value={register}>
      {children}
    </AdminSheetFooterSlotContext.Provider>
  );
}

/** Внутри провайдера рендерится только в слот футера; иначе — inline (fallback). */
export function AdminSheetFixedFooter({ children }: { children: ReactNode }) {
  const register = useContext(AdminSheetFooterSlotContext);

  useLayoutEffect(() => {
    if (!register) return undefined;
    return register(children);
  }, [register, children]);

  if (register) return null;
  return <>{children}</>;
}
