import { cn } from '@fluid/utils';
import type { HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
}

const variants = {
  default: 'bg-theme-surface border border-theme-border text-theme-subtle',
  success: 'bg-theme-surface border border-green-500/20 text-green-700',
  warning: 'bg-theme-surface border border-amber-500/20 text-amber-700',
  danger: 'bg-theme-surface border border-red-500/20 text-red-700',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
};

export function Badge({ className, variant = 'default', size = 'md', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        'transition-all duration-150',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
