'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthCard from './AuthCard';
import { useAuth } from './AuthProvider';

export default function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const registrationMessage = searchParams.get('registered') === 'confirm'
    ? 'Account created. Check your email to confirm it before signing in.'
    : searchParams.get('registered') === 'ready' ? 'Account created. You can now sign in.' : '';

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setIsSubmitting(true);
    try {
      const user = await login(email, password);
      const requested = searchParams.get('returnTo');
      const safeReturn = requested?.startsWith('/') && !requested.startsWith('//') ? requested : null;
      router.push(safeReturn ?? (user.role === 'manager' ? '/manager' : '/'));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Login failed.');
    } finally { setIsSubmitting(false); }
  };

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to order products or manage the store." footer={<>New to PulseCart? <Link href="/register" className="font-semibold text-primary hover:text-primary-hover transition-colors">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-5">
        {registrationMessage && (
          <div className="rounded-xl bg-success-light p-4 border border-success/20 flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-success mt-0.5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
            <p className="text-sm text-success" role="status">{registrationMessage}</p>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="block w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all sm:text-sm shadow-sm" placeholder="you@example.com" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
          <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="block w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all sm:text-sm shadow-sm" placeholder="••••••••" />
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
              Signing in...
            </>
          ) : 'Sign in'}
        </button>
      </form>
    </AuthCard>
  );
}
