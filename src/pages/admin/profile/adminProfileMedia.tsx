import type { ImgHTMLAttributes, ReactNode } from 'react';
import { ImageReveal } from '../../../shared/ui/ImageReveal';

const coverImgStyle = { objectFit: 'cover' as const, objectPosition: 'center' as const };
const containImgStyle = { objectFit: 'contain' as const, objectPosition: 'center' as const };

type FrameProps = {
  aspectClass?: string;
  className?: string;
  children: ReactNode;
};

/** Контейнер с фиксированным соотношением сторон — фото внутри не растягивается. */
export function ProfileMediaFrame({ aspectClass, className = '', children }: FrameProps) {
  return (
    <div className={`relative overflow-hidden ${aspectClass ?? ''} ${className}`.trim()}>{children}</div>
  );
}

type MediaImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'style'> & {
  fit?: 'cover' | 'contain';
  useReveal?: boolean;
};

function ProfileMediaImageInner({
  fit = 'cover',
  className = '',
  useReveal = true,
  ...rest
}: MediaImageProps) {
  const fitClass = fit === 'contain' ? 'object-contain' : 'object-cover';
  const imgClass = `absolute inset-0 h-full w-full max-h-full max-w-full ${fitClass} object-center ${className}`;
  const style = fit === 'contain' ? containImgStyle : coverImgStyle;

  if (useReveal) {
    return <ImageReveal {...rest} className={imgClass} style={style} />;
  }

  return <img {...rest} className={imgClass} style={style} decoding="async" />;
}

/** Обложка / баннер профиля. */
export function ProfileCoverImage({
  aspectClass = 'aspect-[16/9]',
  frameClassName = '',
  fit = 'cover',
  ...imgProps
}: MediaImageProps & { aspectClass?: string; frameClassName?: string }) {
  return (
    <ProfileMediaFrame aspectClass={aspectClass} className={frameClassName}>
      <ProfileMediaImageInner fit={fit} {...imgProps} />
    </ProfileMediaFrame>
  );
}

/** Круглый аватар. */
export function ProfileAvatarImage({
  sizeClass = 'h-[88px] w-[88px]',
  ringClassName = 'ring-4 ring-white',
  ...imgProps
}: MediaImageProps & { sizeClass?: string; ringClassName?: string }) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-[#EBEBEB] ${sizeClass} ${ringClassName}`}
    >
      <ProfileMediaImageInner {...imgProps} />
    </div>
  );
}

/** Прямоугольное превью в формах (редактирование профиля, портфолио). */
export function ProfilePreviewImage({
  aspectClass = 'aspect-[16/10]',
  frameClassName = 'rounded-[12px] bg-[#EBEBEB]',
  fit = 'cover',
  useReveal = false,
  ...imgProps
}: MediaImageProps & { aspectClass?: string; frameClassName?: string }) {
  return (
    <ProfileMediaFrame aspectClass={aspectClass} className={frameClassName}>
      <ProfileMediaImageInner fit={fit} useReveal={useReveal} {...imgProps} />
    </ProfileMediaFrame>
  );
}
