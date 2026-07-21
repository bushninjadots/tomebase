export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-theme-page">
      <div className="mx-auto max-w-3xl py-8 px-4">
        <div className="h-8 w-48 animate-pulse rounded bg-theme-hover mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-theme-border bg-theme-card" />
          ))}
        </div>
      </div>
    </div>
  );
}
