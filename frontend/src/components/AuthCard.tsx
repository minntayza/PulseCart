import { ReactNode } from 'react';
import Link from 'next/link';

export default function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <main className="min-h-[calc(100vh-56px)] grid place-items-center p-6">
      <section className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-xl">
        <Link href="/" className="text-xs text-muted hover:text-primary">← Back to shop</Link>
        <h1 className="text-2xl font-bold mt-5">{title}</h1>
        <p className="text-sm text-muted mt-1 mb-6">{subtitle}</p>
        {children}
        <div className="text-sm text-muted text-center mt-6">{footer}</div>
      </section>
    </main>
  );
}
