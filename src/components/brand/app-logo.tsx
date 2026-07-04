import Image from 'next/image';
import { cn } from '@/lib/utils';
import { DEFAULT_BRAND_LOGO } from '@/lib/branding/constants';

interface AppLogoProps {
  className?: string;
  /** Pixel size of the square container (width & height). */
  size?: number;
  /** Custom logo URL; falls back to the default brand mark. */
  src?: string | null;
  /** Render logo in white (for use on primary-colored backgrounds). */
  invert?: boolean;
}

/** Brand mark — account logo or default, optionally rendered in white. */
export function AppLogo({
  className,
  size = 16,
  src,
  invert = true,
}: AppLogoProps) {
  const logoSrc = src?.trim() || DEFAULT_BRAND_LOGO;
  const isRemote = logoSrc.startsWith('http');

  return (
    <Image
      src={logoSrc}
      alt=""
      width={size}
      height={size}
      unoptimized={isRemote || logoSrc.endsWith('.svg')}
      className={cn(
        'object-contain',
        invert && 'brightness-0 invert',
        className,
      )}
      aria-hidden
    />
  );
}
