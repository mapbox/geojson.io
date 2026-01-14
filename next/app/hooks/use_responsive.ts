import { useMediaQuery } from 'react-responsive';

/**
 * This should match the tailwind defaults
 * https://tailwindcss.com/docs/screens
 */
const SIZES = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

export function useBreakpoint(size: keyof typeof SIZES) {
  return useMediaQuery({
    query: `(min-width: ${SIZES[size]}px)`
  });
}
