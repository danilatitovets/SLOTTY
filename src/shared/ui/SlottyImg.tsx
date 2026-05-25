import { forwardRef, type ImgHTMLAttributes } from 'react';

type SlottyImgProps = ImgHTMLAttributes<HTMLImageElement> & {
  /** Приоритет загрузки (в DOM — `fetchpriority`, не `fetchPriority`). */
  fetchPriority?: 'high' | 'low' | 'auto';
};

/**
 * Обёртка над `<img>`: React 18 не принимает camelCase `fetchPriority` на DOM-элементе.
 */
export const SlottyImg = forwardRef<HTMLImageElement, SlottyImgProps>(function SlottyImg(
  { fetchPriority, ...rest },
  ref,
) {
  return (
    <img
      ref={ref}
      {...rest}
      {...(fetchPriority ? { fetchpriority: fetchPriority } : {})}
    />
  );
});
