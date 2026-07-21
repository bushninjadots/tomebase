export default function AILoading() {
  return (
    <div className="min-h-screen bg-theme-page">
      <div className="mx-auto max-w-3xl py-8 px-4">
        <div className="h-8 w-48 animate-pulse rounded bg-theme-hover mb-6" />
        <div className="h-40 animate-pulse rounded-xl border border-theme-border bg-theme-card mb-4" />
        <div className="h-40 animate-pulse rounded-xl border border-theme-border bg-theme-card" />
      </div>
    </div>
  );
}
