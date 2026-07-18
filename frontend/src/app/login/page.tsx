import { Suspense } from 'react';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return <Suspense fallback={<p className="p-8 text-center text-text-muted">Loading sign in…</p>}><LoginForm /></Suspense>;
}
