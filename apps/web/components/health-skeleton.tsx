'use client';

import { Activity } from 'lucide-react';

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-theme-hover ${className || ''}`} />
  );
}

export function HealthPageSkeleton() {
  return (
    <div className="min-h-screen bg-theme-page">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SkeletonPulse className="h-8 w-64" />
            <SkeletonPulse className="h-6 w-20 rounded-full" />
          </div>
          <SkeletonPulse className="h-4 w-96" />
        </div>

        {/* Score + Summary skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          <div className="lg:col-span-4 rounded-2xl border border-theme-border bg-theme-card p-6">
            <div className="flex flex-col items-center">
              <SkeletonPulse className="rounded-full w-40 h-40" />
              <SkeletonPulse className="h-4 w-24 mt-4" />
              <SkeletonPulse className="h-3 w-16 mt-2" />
            </div>
          </div>
          <div className="lg:col-span-8 rounded-2xl border border-theme-border bg-theme-card p-6">
            <SkeletonPulse className="h-5 w-32 mb-4" />
            <div className="grid grid-cols-3 gap-4 mb-6">
              <SkeletonPulse className="h-16 rounded-xl" />
              <SkeletonPulse className="h-16 rounded-xl" />
              <SkeletonPulse className="h-16 rounded-xl" />
            </div>
            <div className="space-y-2">
              <SkeletonPulse className="h-10 rounded-xl" />
              <SkeletonPulse className="h-10 rounded-xl" />
              <SkeletonPulse className="h-10 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="flex items-center gap-1 border-b border-theme-border mb-6">
          <SkeletonPulse className="h-10 w-28" />
          <SkeletonPulse className="h-10 w-40" />
        </div>

        {/* Content skeleton */}
        <div className="space-y-4">
          <SkeletonPulse className="h-20 rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SkeletonPulse className="h-24 rounded-xl" />
            <SkeletonPulse className="h-24 rounded-xl" />
            <SkeletonPulse className="h-24 rounded-xl" />
            <SkeletonPulse className="h-24 rounded-xl" />
          </div>
          <SkeletonPulse className="h-32 rounded-2xl" />
          <SkeletonPulse className="h-16 rounded-xl" />
          <SkeletonPulse className="h-16 rounded-xl" />
          <SkeletonPulse className="h-16 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
