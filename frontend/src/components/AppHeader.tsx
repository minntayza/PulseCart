'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import NavCartButton from './NavCartButton';
import SearchInput from './SearchInput';
import ThemeToggle from './ThemeToggle';
import { useAuth } from './AuthProvider';

export default function AppHeader() {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const navLink = (active: boolean) => `rounded-lg px-3 py-2 text-sm font-medium transition ${active ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-surface-alt hover:text-foreground'}`;
  const signOut = () => { logout(); router.push('/'); };
  return <header className="sticky top-0 z-50 border-b border-border/80 bg-surface/90 backdrop-blur-xl"><div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
    <Link href="/" className="mr-2 flex items-center gap-2.5" aria-label="PulseCart home"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-agent font-black text-white shadow-sm">P</span><span className="text-lg font-extrabold tracking-[-0.03em] text-foreground">PulseCart</span></Link>
    <nav className="order-3 flex w-full items-center gap-1 sm:order-none sm:w-auto"><Link href="/" className={navLink(pathname === '/')}>Shop</Link>{user?.role === 'customer' && <Link href="/account/orders" className={navLink(pathname.startsWith('/account'))}>My orders</Link>}{user?.role === 'manager' && <Link href="/manager" className={navLink(pathname === '/manager')}>Dashboard</Link>}</nav>
    <div className="order-4 w-full sm:order-none sm:mx-auto sm:max-w-sm lg:max-w-md">{pathname === '/' && <SearchInput />}</div>
    <div className="ml-auto flex items-center gap-2"><ThemeToggle/><NavCartButton/>{!isLoading && (user ? <div className="flex items-center gap-2"><div className="hidden text-right md:block"><p className="text-xs font-semibold text-foreground">{user.username}</p><p className="text-[10px] capitalize text-text-muted">{user.role}</p></div><button onClick={signOut} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-text-secondary transition hover:border-danger/30 hover:text-danger">Log out</button></div> : <Link href="/login" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary/20">Sign in</Link>)}</div>
  </div></header>;
}
