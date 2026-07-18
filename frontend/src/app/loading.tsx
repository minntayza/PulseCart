import { Skeleton, ProductCardSkeleton } from '@/components/Skeleton';

export default function Loading() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--primary)_10%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--primary)_10%,transparent)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      <section className="relative pt-16 pb-12 sm:pt-24 sm:pb-16 lg:pt-32 lg:pb-24 border-b border-border/60 bg-surface/40 backdrop-blur-3xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <Skeleton className="h-6 w-64 rounded-full mb-8" />
          <Skeleton className="h-12 sm:h-16 w-3/4 max-w-2xl mb-4" />
          <Skeleton className="h-12 sm:h-16 w-1/2 max-w-md" />
          <Skeleton className="mt-6 h-6 w-2/3 max-w-lg" />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full flex-shrink-0" />
          ))}
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
