export default function ImportLoading() {
  return (
    <div className="min-h-screen bg-theme-page">
      <div className="mx-auto max-w-4xl py-8 px-4">
        <div className="h-4 w-32 animate-pulse rounded bg-theme-hover mb-6" />
        <div className="h-8 w-56 animate-pulse rounded bg-theme-hover mb-8" />
        <div className="h-64 animate-pulse rounded-2xl border border-theme-border bg-theme-card" />
      </div>
    </div>
  );
}
