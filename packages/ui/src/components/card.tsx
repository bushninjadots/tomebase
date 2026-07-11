import { cn } from '@fluid/utils';
import type { HTMLAttributes, ReactNode } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[14px] border border-theme-border bg-theme-card shadow-sm',
        'transition-all duration-150 ease-out',
        'hover:border-theme-accent/20 hover:shadow-md',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, children, ...props }: { className?: string; children: ReactNode; [key: string]: any }) {
  return (
    <div
      className={cn(
        'px-5 pt-5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-5', className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('border-t border-theme-border px-5 py-3.5', className)}
      {...props}
    />
  );
}
