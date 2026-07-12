import { forwardRef } from 'react';
import { cn } from '@fluid/utils';
import type { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary:
    'bg-theme-accent text-gray-900 hover:bg-theme-accent-hover focus-visible:ring-theme-accent-ring shadow-sm font-semibold',
  secondary:
    'bg-theme-surface text-theme-main hover:bg-theme-hover focus-visible:ring-theme-accent-ring',
  ghost:
    'text-theme-subtle hover:text-theme-main hover:bg-theme-hover focus-visible:ring-theme-accent-ring',
  outline:
    'border border-theme-border text-theme-main hover:border-theme-accent/30 hover:bg-theme-hover focus-visible:ring-theme-accent-ring',
};

const sizes = {
  sm: 'h-8 px-3 rounded-[8px] text-[13px]',
  md: 'h-10 px-4 rounded-[8px] text-[13px]',
  lg: 'h-12 px-6 rounded-[8px] text-[14px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'active:scale-[0.98]',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
