export default function LoadingTrilhas() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="h-8 w-64 rounded bg-stone-200 animate-pulse" />
          <div className="h-4 w-80 rounded bg-stone-200 animate-pulse" />
        </div>
        <div className="h-12 w-72 rounded-xl bg-stone-200 animate-pulse" />
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <article
            key={index}
            className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
          >
            <div className="h-40 bg-stone-200 animate-pulse" />
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 rounded bg-stone-200 animate-pulse" />
                <div className="h-3 w-24 rounded bg-stone-200 animate-pulse" />
              </div>
              <div className="h-6 w-3/4 rounded bg-stone-200 animate-pulse" />
              <div className="h-4 w-24 rounded bg-stone-200 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-stone-200 animate-pulse" />
                <div className="h-4 w-5/6 rounded bg-stone-200 animate-pulse" />
              </div>
              <div className="h-10 w-full rounded-lg bg-stone-200 animate-pulse" />
              <div className="h-10 w-full rounded-lg bg-stone-200 animate-pulse" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
