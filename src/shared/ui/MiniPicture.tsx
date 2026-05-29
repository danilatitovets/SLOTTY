import { MINI_PICTURE, type MiniPictureKey } from './miniPictureSrc';

type Variant = 'aside' | 'empty' | 'hero';

const VARIANT_CLASS: Record<Variant, string> = {
  aside:
    'h-[72px] w-auto max-w-[38%] shrink-0 object-contain object-top sm:h-[100px] sm:max-w-none lg:h-[112px]',
  empty:
    'mx-auto mb-5 block h-auto w-auto max-w-[14rem] select-none object-contain object-center sm:max-w-[16rem]',
  hero: 'relative mx-auto w-full max-w-[15rem] object-contain drop-shadow-[0_18px_40px_rgba(244,124,140,0.12)] sm:max-w-[17rem] lg:max-w-full',
};

type Props = {
  name: MiniPictureKey;
  variant?: Variant;
  className?: string;
  alt?: string;
};

export function MiniPicture({ name, variant = 'empty', className = '', alt = '' }: Props) {
  const src = MINI_PICTURE[name];
  return (
    <img
      src={src}
      alt={alt}
      decoding="async"
      draggable={false}
      className={`${VARIANT_CLASS[variant]} ${className}`.trim()}
    />
  );
}
