import { Skeleton, OrderSkeleton } from '@/components/Skeleton';

export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-10 w-16 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-10 w-24 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-10 w-16 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <section className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <Skeleton className="h-8 w-48" />
            </div>
            
            <div className="mb-6 flex gap-2">
              <Skeleton className="h-10 w-24 rounded-full" />
              <Skeleton className="h-10 w-24 rounded-full" />
              <Skeleton className="h-10 w-24 rounded-full" />
            </div>

            <div className="space-y-4">
              <OrderSkeleton />
              <OrderSkeleton />
              <OrderSkeleton />
              <OrderSkeleton />
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
              <Skeleton className="h-8 w-48 mb-6" />
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
