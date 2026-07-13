import { forwardRef, useId } from 'react';
import { cn } from '@fluid/utils';
import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id: providedId, ...props }, ref) => {
    const autoId = useId();
    const id = providedId || autoId;
    const errorId = `${id}-error`;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-theme-subtle">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'block w-full rounded-lg border border-theme-border bg-theme-card px-3 py-2 text-sm text-theme-main shadow-sm',
            'placeholder:text-theme-muted',
            'focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className,
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
