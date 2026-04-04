function RowSkeleton() {
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_160px_140px_120px] gap-4 items-center px-6 py-4 border-t border-stone-100">
      <div className="flex items-center gap-4">
        <div className="h-12 w-20 rounded-lg bg-stone-200 animate-pulse" />
        <div className="h-4 w-48 rounded bg-stone-200 animate-pulse" />
      </div>
      <div className="h-8 w-24 rounded-full bg-stone-200 animate-pulse" />
      <div className="h-4 w-20 rounded bg-stone-200 animate-pulse" />
      <div className="ml-auto h-4 w-16 rounded bg-stone-200 animate-pulse" />
    </div>
  );
}

export default function LoadingAdminCursos() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-3">
          <div className="h-8 w-64 rounded bg-stone-200 animate-pulse" />
          <div className="h-4 w-80 rounded bg-stone-200 animate-pulse" />
        </div>
        <div className="h-11 w-36 rounded-xl bg-stone-200 animate-pulse" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-stone-50/50">
          <div className="h-10 w-full max-w-md rounded-lg bg-stone-200 animate-pulse" />
        </div>
        <div>
          {Array.from({ length: 5 }).map((_, index) => (
            <RowSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
