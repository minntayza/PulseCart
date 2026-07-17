'use client';
import { useEffect, useState } from 'react';
type Theme = 'light' | 'dark';
function preferredTheme(): Theme { const stored = window.localStorage.getItem('pulsecart:theme'); if (stored === 'light' || stored === 'dark') return stored; return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  useEffect(() => { const timer = window.setTimeout(() => { const initial = preferredTheme(); setTheme(initial); document.documentElement.dataset.theme = initial; }, 0); return () => window.clearTimeout(timer); }, []);
  const toggle = () => { const next = theme === 'light' ? 'dark' : 'light'; setTheme(next); document.documentElement.dataset.theme = next; window.localStorage.setItem('pulsecart:theme', next); };
  return <button onClick={toggle} className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface text-text-secondary transition hover:border-primary/30 hover:bg-primary-light hover:text-primary" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>{theme === 'light' ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5"><path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z" strokeWidth="1.8" strokeLinejoin="round"/></svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5"><circle cx="12" cy="12" r="4" strokeWidth="1.8"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeWidth="1.8" strokeLinecap="round"/></svg>}</button>;
}
