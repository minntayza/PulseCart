'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthCard from '@/components/AuthCard';
import { useAuth } from '@/components/AuthProvider';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (form.username.trim().length < 3) return setError('Username must contain at least 3 characters.');
    if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/\d/.test(form.password)) return setError('Password must be 8+ characters and include uppercase, lowercase, and a number.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setError(''); setIsSubmitting(true);
    try {
      const result = await register(form.username, form.email, form.password);
      router.push(result.needsEmailConfirmation ? '/login?registered=confirm' : '/');
    }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Registration failed.'); }
    finally { setIsSubmitting(false); }
  };

  const field = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <AuthCard title="Create your account" subtitle="Register as a customer to submit orders." footer={<>Already registered? <Link href="/login" className="font-semibold text-primary hover:text-primary-hover transition-colors">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Username</label>
          <input required value={form.username} onChange={(event) => field('username', event.target.value)} autoComplete="username" className="block w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all sm:text-sm shadow-sm" placeholder="johndoe" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
          <input required type="email" value={form.email} onChange={(event) => field('email', event.target.value)} autoComplete="email" className="block w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all sm:text-sm shadow-sm" placeholder="you@example.com" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
          <input required type="password" value={form.password} onChange={(event) => field('password', event.target.value)} autoComplete="new-password" className="block w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all sm:text-sm shadow-sm" placeholder="••••••••" />
          <p className="text-xs text-text-secondary mt-2 ml-1">8+ characters with uppercase, lowercase, and a number.</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Confirm password</label>
          <input required type="password" value={form.confirm} onChange={(event) => field('confirm', event.target.value)} autoComplete="new-password" className="block w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all sm:text-sm shadow-sm" placeholder="••••••••" />
        </div>
        
        {error && (
          <div className="rounded-xl bg-danger-light p-4 border border-danger/20 flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-danger mt-0.5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
            <p className="text-sm text-danger" role="alert">{error}</p>
          </div>
        )}
        
        <button disabled={isSubmitting} className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm shadow-primary/20 text-sm font-bold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed transition-colors">
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Creating account...
            </>
          ) : 'Create customer account'}
        </button>
      </form>
    </AuthCard>
  );
}
