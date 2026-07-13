export default function DashboardLoading() {
  return (
    <div className="flex h-screen bg-theme-page">
      <div className="hidden md:flex w-56 shrink-0 flex-col border-r border-theme-border bg-theme-card/30">
        <div className="h-14 border-b border-theme-border px-4 flex items-center">
          <div className="h-6 w-24 animate-pulse rounded bg-theme-hover" />
        </div>
        <div className="p-3 space-y-3">
          <div className="h-3 w-16 animate-pulse rounded bg-theme-hover" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-full animate-pulse rounded-lg bg-theme-hover" />
          ))}
        </div>
      </div>
      <main className="flex-1 p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-theme-hover mb-6" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-theme-border bg-theme-card" />
          ))}
        </div>
      </main>
    </div>
  );
}
