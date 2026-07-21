import { Loader2 } from 'lucide-react';

const sizes = {
  xs: 'h-2.5 w-2.5',
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
  xl: 'h-5 w-5',
  '2xl': 'h-8 w-8',
} as const;

type SpinnerSize = keyof typeof sizes;

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <Loader2 className={`${sizes[size]} animate-spin ${className}`} />
  );
}
