import { cn } from '@fluid/utils';
import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-lg border border-theme-border bg-theme-input',
        'px-3 py-1.5 text-sm text-theme-main',
        'placeholder:text-theme-muted',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-colors duration-150',
        className,
      )}
      {...props}
    />
  );
}
