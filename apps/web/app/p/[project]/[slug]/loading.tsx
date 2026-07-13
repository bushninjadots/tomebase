export default function PublishedLoading() {
  return (
    <div className="mx-auto max-w-[760px] px-6 py-10 sm:py-14">
      <div className="mb-6 flex items-center gap-1.5">
        <div className="h-3 w-16 skeleton rounded bg-theme-hover" />
        <div className="h-3 w-2 skeleton rounded bg-theme-hover" />
        <div className="h-3 w-24 skeleton rounded bg-theme-hover" />
      </div>
      <header className="mb-10 text-center space-y-3">
        <div className="h-10 w-72 mx-auto skeleton rounded bg-theme-hover" />
        <div className="h-4 w-48 mx-auto skeleton rounded bg-theme-hover" />
      </header>
      <div className="h-48 w-full skeleton rounded-2xl border border-theme-border bg-theme-card mb-10" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="h-4 w-full skeleton rounded bg-theme-hover mb-2" style={{ animationDelay: `${i * 100}ms` }} />
            <div className="h-4 w-3/4 skeleton rounded bg-theme-hover" style={{ animationDelay: `${i * 100 + 50}ms` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
