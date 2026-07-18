import { Skeleton } from '@/components/Skeleton';

export default function Loading() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-8 flex items-center gap-2">
          <Skeleton className="h-5 w-16" />
          <span className="text-border">•</span>
          <Skeleton className="h-5 w-24" />
          <span className="text-border">•</span>
          <Skeleton className="h-5 w-32" />
        </nav>
        
        <section className="grid gap-12 lg:grid-cols-[1.15fr_.85fr]">
          <Skeleton className="min-h-[32rem] rounded-[2.5rem]" />
          
          <div className="lg:py-8 flex flex-col justify-center">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-12 w-3/4 mb-5" />
            <Skeleton className="h-5 w-48 mb-6" />
            
            <div className="space-y-2 mb-8">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            
            <div className="mt-8 flex items-end justify-between border-y border-border py-6">
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-10 w-32" />
              </div>
              <Skeleton className="h-5 w-36" />
            </div>
            
            <div className="mt-8">
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
            
            <div className="mt-8 rounded-2xl border border-border p-5">
              <div className="flex gap-4">
                <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
