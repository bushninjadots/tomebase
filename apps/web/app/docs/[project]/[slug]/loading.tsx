export default function DocPageLoading() {
  return (
    <div className="flex min-h-screen bg-theme-page">
      <div className="hidden lg:flex w-56 shrink-0 flex-col border-r border-theme-border bg-theme-card/30 p-4">
        <div className="h-6 w-24 animate-pulse rounded bg-theme-hover mb-4" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-6 w-full animate-pulse rounded bg-theme-hover mb-2" />
        ))}
      </div>
      <main className="flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="h-8 w-64 animate-pulse rounded bg-theme-hover mb-4" />
          <div className="h-4 w-96 animate-pulse rounded bg-theme-hover mb-8" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-theme-hover" style={{ width: `${85 - i * 10}%` }} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
