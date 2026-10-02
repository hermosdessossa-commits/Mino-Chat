export function ConversationListSkeleton() {
  return (
    <div className="divide-y divide-surface-200 dark:divide-surface-700">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="p-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-surface-200 dark:bg-surface-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-surface-200 dark:bg-surface-700 rounded" />
              <div className="h-3 w-1/2 bg-surface-200 dark:bg-surface-700 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}