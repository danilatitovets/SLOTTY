import { forwardRef, useLayoutEffect, useRef, useState, type ImgHTMLAttributes } from 'react';

/**
 * Показывает изображение только после полной загрузки (событие load / уже закэшировано),
 * чтобы не было видимой «полоски» progressive JPEG при скролле.
 */
type ImageRevealProps = ImgHTMLAttributes<HTMLImageElement> & {
  fetchPriority?: 'high' | 'low' | 'auto';
};

export const ImageReveal = forwardRef<HTMLImageElement, ImageRevealProps>(function ImageReveal(
  { className, style, onLoad, onError, src, decoding = 'sync', fetchPriority, ...rest },
  forwardedRef,
) {
  const innerRef = useRef<HTMLImageElement | null>(null);
  const [shown, setShown] = useState(false);

  const setRefs = (el: HTMLImageElement | null) => {
    innerRef.current = el;
    if (typeof forwardedRef === 'function') {
      forwardedRef(el);
    } else if (forwardedRef) {
      forwardedRef.current = el;
    }
  };

  useLayoutEffect(() => {
    setShown(false);
    const el = innerRef.current;
    if (el?.complete && el.naturalWidth > 0) {
      setShown(true);
    }
  }, [src]);

  const wantsCover = typeof className === 'string' && className.includes('object-cover');
  const wantsContain = typeof className === 'string' && className.includes('object-contain');

  const srcStr = typeof src === 'string' ? src : '';
  const oauthAvatar =
    srcStr.length > 0 &&
    /googleusercontent\.com|ggpht\.com|telegram-cdn\.org|telesco\.pe|t\.me\/i\/userpic/i.test(srcStr);

  return (
    <img
      {...rest}
      ref={setRefs}
      src={src}
      referrerPolicy={rest.referrerPolicy ?? (oauthAvatar ? 'no-referrer' : undefined)}
      {...(fetchPriority ? { fetchpriority: fetchPriority } : {})}
      decoding={decoding}
      style={{
        ...style,
        opacity: shown ? 1 : 0,
        ...(wantsCover ? { objectFit: 'cover' } : {}),
        ...(wantsContain ? { objectFit: 'contain' } : {}),
      }}
      className={className}
      onLoad={(e) => {
        setShown(true);
        onLoad?.(e);
      }}
      onError={(e) => {
        setShown(true);
        onError?.(e);
      }}
    />
  );
});
