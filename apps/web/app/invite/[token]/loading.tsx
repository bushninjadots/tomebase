export default function InviteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-theme-page">
      <div className="text-center">
        <div className="h-12 w-12 animate-pulse rounded-full bg-theme-hover mx-auto mb-4" />
        <div className="h-6 w-48 animate-pulse rounded bg-theme-hover mx-auto mb-2" />
        <div className="h-4 w-64 animate-pulse rounded bg-theme-hover mx-auto" />
      </div>
    </div>
  );
}
