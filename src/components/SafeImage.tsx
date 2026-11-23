import { useEffect, useState } from 'react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function SafeImage({ src, alt, className = '' }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed || !src) {
    return (
      <div
        className={`bg-light-surface-container-low flex flex-col items-center justify-center p-md text-center text-light-on-surface-variant ${className}`}
        role="img"
        aria-label={alt}
      >
        <span className="material-symbols-outlined text-[32px] text-light-primary mb-1" aria-hidden="true">
          inventory_2
        </span>
        <span className="font-label text-label-sm line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
