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
    <AuthCard title="Create your account" subtitle="Register as a customer to submit orders." footer={<>Already registered? <Link href="/login" className="text-primary">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm">Username<input required value={form.username} onChange={(event) => field('username', event.target.value)} autoComplete="username" className="mt-1 w-full px-3 py-2 bg-white/5 border border-border rounded-lg" /></label>
        <label className="block text-sm">Email<input required type="email" value={form.email} onChange={(event) => field('email', event.target.value)} autoComplete="email" className="mt-1 w-full px-3 py-2 bg-white/5 border border-border rounded-lg" /></label>
        <label className="block text-sm">Password<input required type="password" value={form.password} onChange={(event) => field('password', event.target.value)} autoComplete="new-password" className="mt-1 w-full px-3 py-2 bg-white/5 border border-border rounded-lg" /></label>
        <p className="text-xs text-muted">8+ characters with uppercase, lowercase, and a number.</p>
        <label className="block text-sm">Confirm password<input required type="password" value={form.confirm} onChange={(event) => field('confirm', event.target.value)} autoComplete="new-password" className="mt-1 w-full px-3 py-2 bg-white/5 border border-border rounded-lg" /></label>
        {error && <p className="text-xs text-danger" role="alert">{error}</p>}
        <button disabled={isSubmitting} className="w-full py-2 bg-primary text-white rounded-lg disabled:opacity-50">{isSubmitting ? 'Creating account…' : 'Create customer account'}</button>
      </form>
    </AuthCard>
  );
}
