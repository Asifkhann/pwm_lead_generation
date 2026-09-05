/** Row placeholders shown while the first page of leads loads. */
export default function LeadsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-slate-100" aria-busy="true" aria-label="Loading leads">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-4 sm:px-6">
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-40 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="hidden h-5 w-20 animate-pulse rounded-full bg-slate-100 sm:block" />
          <div className="hidden h-5 w-16 animate-pulse rounded-full bg-slate-100 sm:block" />
          <div className="hidden h-3.5 w-24 animate-pulse rounded bg-slate-100 lg:block" />
        </div>
      ))}
    </div>
  )
}
