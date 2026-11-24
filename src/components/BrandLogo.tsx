import { withBase } from '../lib/api';
export const BRAND_LOCKUP_URL = withBase('/assets/aistudio/Modern_Green_Hygiene_Logo_020f5572.png');
export const BRAND_WORDMARK_URL = withBase('/assets/aistudio/Modern_Green_Hygiene_Logo_-_Copy_3183ca2d.png');
export const BRAND_ICON_URL = withBase('/assets/aistudio/Modern_Green_Hygiene_Logo_-_Copy__2__b99ea182.png');

interface BrandLogoProps {
  variant?: 'horizontal' | 'full' | 'icon';
  surface?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BrandLogo({
  variant = 'horizontal',
  surface = 'light',
  size = 'md',
  className = '',
}: BrandLogoProps) {
  if (variant === 'icon') {
    const dim = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';
    return (
      <img
        src={BRAND_ICON_URL}
        alt="HYGIENOVO"
        className={`${dim} object-contain shrink-0 ${className}`}
      />
    );
  }

  if (variant === 'full') {
    const heightClass = size === 'sm' ? 'h-12' : size === 'lg' ? 'h-20' : 'h-16';
    const wrapperClass =
      surface === 'dark'
        ? 'inline-flex items-center bg-pure-white rounded-md px-3 py-1 shadow-sm'
        : 'inline-flex items-center';
    return (
      <span className={`${wrapperClass} ${className}`}>
        <img
          src={BRAND_LOCKUP_URL}
          alt="HYGIENOVO — A Cleaner Standard for Every Space."
          className={`${heightClass} w-auto object-contain`}
        />
      </span>
    );
  }

  const iconHeight = size === 'sm' ? 'h-8' : size === 'lg' ? 'h-11' : 'h-9 xl:h-10';
  const wordmarkHeight = size === 'sm' ? 'h-7' : size === 'lg' ? 'h-10' : 'h-8 xl:h-9';
  const dividerHeight = size === 'sm' ? 'h-6' : size === 'lg' ? 'h-9' : 'h-7 xl:h-8';

  const content = (
    <span className="inline-flex items-center gap-2 sm:gap-2.5 shrink-0">
      <img
        src={BRAND_ICON_URL}
        alt=""
        aria-hidden="true"
        className={`${iconHeight} w-auto object-contain shrink-0`}
      />
      <span
        aria-hidden="true"
        className={`w-[1.5px] ${dividerHeight} bg-gold-accent/80 rounded-full shrink-0`}
      />
      <img
        src={BRAND_WORDMARK_URL}
        alt="HYGIENOVO — A Cleaner Standard for Every Space."
        className={`${wordmarkHeight} w-auto object-contain shrink-0`}
      />
    </span>
  );

  if (surface === 'dark') {
    return (
      <span
        className={`inline-flex items-center w-fit bg-pure-white rounded-md px-3.5 py-2 shadow-sm ${className}`}
      >
        {content}
      </span>
    );
  }

  return <span className={`inline-flex items-center shrink-0 ${className}`}>{content}</span>;
}
