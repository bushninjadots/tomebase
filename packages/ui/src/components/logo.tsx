import { cn } from '@fluid/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'h-6',
  md: 'h-8',
  lg: 'h-10',
};

export function Logo({ className, size = 'md' }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        viewBox="0 0 32 32"
        fill="none"
        className={cn(sizes[size], 'aspect-square')}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="fluid-logo" x1="0" y1="0" x2="32" y2="32">
            <stop offset="0%" stopColor="#0c8ee7" />
            <stop offset="100%" stopColor="#7cc8fb" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="url(#fluid-logo)" />
        <path
          d="M8 16h16M16 8v16M10 10l12 12M22 10L10 22"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />
        <circle cx="16" cy="16" r="4" fill="white" />
      </svg>
      <span className="font-semibold tracking-tight text-gray-900">TomeBase</span>
    </div>
  );
}
