export default function DocsLoading() {
  return (
    <div className="flex h-screen bg-theme-page">
      <div className="hidden md:flex w-56 shrink-0 flex-col border-r border-theme-border bg-theme-card/30">
        <div className="h-14 border-b border-theme-border px-4 flex items-center">
          <div className="h-6 w-24 skeleton rounded bg-theme-hover" />
        </div>
        <div className="p-3 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-full skeleton rounded-lg bg-theme-hover" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      </div>
      <main className="flex-1 p-8 max-w-3xl mx-auto w-full">
        <div className="h-8 w-64 skeleton rounded bg-theme-hover mb-4" />
        <div className="h-4 w-96 skeleton rounded bg-theme-hover mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 w-full skeleton rounded-xl border border-theme-border bg-theme-card" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </main>
    </div>
  );
}
