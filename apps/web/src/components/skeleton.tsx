export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 animate-pulse rounded-full bg-kc-surface-3" />
        <div className="h-4 w-24 animate-pulse rounded bg-kc-surface-3" />
      </div>
      <div className="h-4 w-12 animate-pulse rounded bg-kc-surface-3" />
    </div>
  );
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-kc-border">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
