export default function Loading() {
  return (
    <div className="flex min-h-screen">
      <div className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar animate-pulse" />
      <main className="flex-1 ml-64">
        <div className="container py-8 px-8">
          <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse mb-8" />
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
