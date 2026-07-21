export default function HealthLoading() {
  return (
    <div className="min-h-screen bg-theme-page">
      <div className="mx-auto max-w-6xl py-8 px-4">
        <div className="h-4 w-32 animate-pulse rounded bg-theme-hover mb-6" />
        <div className="h-8 w-64 animate-pulse rounded bg-theme-hover mb-2" />
        <div className="h-4 w-96 animate-pulse rounded bg-theme-hover mb-8" />
        <div className="h-10 w-64 animate-pulse rounded-lg bg-theme-hover mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 h-64 animate-pulse rounded-2xl border border-theme-border bg-theme-card" />
          <div className="lg:col-span-8 h-64 animate-pulse rounded-2xl border border-theme-border bg-theme-card" />
        </div>
        <div className="mt-6 h-48 animate-pulse rounded-2xl border border-theme-border bg-theme-card" />
      </div>
    </div>
  );
}
