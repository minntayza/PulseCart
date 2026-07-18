import { ReactNode } from 'react';
import Link from 'next/link';

export default function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--primary)_10%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--primary)_10%,transparent)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      <section className="relative w-full max-w-[440px] bg-surface border border-border/80 rounded-3xl p-8 sm:p-10 shadow-[0_8px_40px_rgb(0,0,0,0.04)] hover:shadow-[0_16px_60px_rgb(0,0,0,0.05)] transition-shadow duration-500">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="group mb-6">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20 group-hover:scale-105 group-hover:shadow-primary/30 transition-all duration-300">
              P
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
          <p className="text-sm text-text-secondary mt-2 text-center">{subtitle}</p>
        </div>
        
        {children}
        
        <div className="text-sm text-text-secondary text-center mt-8 pt-6 border-t border-border-light">{footer}</div>
      </section>
    </main>
  );
}
