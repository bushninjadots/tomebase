export default function SignupLoading() {
  return (
    <div className="bg-theme-page flex min-h-screen">
      {/* Left: skeleton for value prop */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center px-12">
        <div className="w-full max-w-md space-y-6">
          <div className="h-10 w-32 animate-pulse rounded bg-theme-hover" />
          <div className="space-y-3">
            <div className="h-10 w-full animate-pulse rounded bg-theme-hover" />
            <div className="h-10 w-3/4 animate-pulse rounded bg-theme-hover" />
            <div className="h-10 w-5/6 animate-pulse rounded bg-theme-hover" />
          </div>
          <div className="h-5 w-full animate-pulse rounded bg-theme-hover mt-4" />
          <div className="h-5 w-3/4 animate-pulse rounded bg-theme-hover" />
          <div className="grid grid-cols-2 gap-4 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-9 w-9 animate-pulse rounded-lg bg-theme-hover shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-20 animate-pulse rounded bg-theme-hover" />
                  <div className="h-2 w-full animate-pulse rounded bg-theme-hover" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: form skeleton */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-theme-border bg-theme-card p-8 shadow-2xl shadow-black/40">
            <div className="mb-6 text-center space-y-2">
              <div className="h-7 w-48 mx-auto animate-pulse rounded bg-theme-hover" />
              <div className="h-4 w-56 mx-auto animate-pulse rounded bg-theme-hover" />
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="h-4 w-12 animate-pulse rounded bg-theme-hover" />
                <div className="h-10 w-full animate-pulse rounded-xl bg-theme-hover" />
              </div>
              <div className="space-y-1.5">
                <div className="h-4 w-12 animate-pulse rounded bg-theme-hover" />
                <div className="h-10 w-full animate-pulse rounded-xl bg-theme-hover" />
              </div>
              <div className="space-y-1.5">
                <div className="h-4 w-16 animate-pulse rounded bg-theme-hover" />
                <div className="h-10 w-full animate-pulse rounded-xl bg-theme-hover" />
              </div>
              <div className="h-11 w-full animate-pulse rounded-xl bg-theme-hover mt-2" />
            </div>
          </div>
          <div className="mt-6 text-center">
            <div className="h-4 w-40 mx-auto animate-pulse rounded bg-theme-hover" />
          </div>
        </div>
      </div>
    </div>
  );
}
