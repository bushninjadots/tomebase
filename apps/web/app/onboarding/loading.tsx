export default function OnboardingLoading() {
  return (
    <div className="min-h-screen bg-theme-page flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Progress bar skeleton */}
        <div className="mb-8 flex items-center justify-between">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center">
              <div className="h-8 w-8 animate-pulse rounded-full bg-theme-hover" />
              {i < 4 && <div className="h-0.5 w-12 sm:w-20 mx-2 animate-pulse bg-theme-hover" />}
            </div>
          ))}
        </div>

        {/* Card skeleton */}
        <div className="rounded-2xl border border-theme-border bg-theme-card p-8 shadow-2xl shadow-black/40">
          <div className="flex flex-col items-center">
            <div className="mb-6 h-16 w-16 animate-pulse rounded-2xl bg-theme-hover" />
            <div className="h-7 w-48 animate-pulse rounded bg-theme-hover mb-3" />
            <div className="h-4 w-64 animate-pulse rounded bg-theme-hover" />
          </div>
          <div className="mt-8 flex items-center justify-between">
            <div className="h-10 w-20 animate-pulse rounded-xl bg-theme-hover" />
            <div className="h-10 w-28 animate-pulse rounded-xl bg-theme-hover" />
          </div>
        </div>
      </div>
    </div>
  );
}
