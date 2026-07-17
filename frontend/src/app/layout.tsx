import type { Metadata } from 'next';
import './globals.css';
import AppHeader from '@/components/AppHeader';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'PulseCart — AI-Powered Shopping',
  description: 'Multi-agent orchestration for smarter e-commerce',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('pulsecart:theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}})()` }} />
      </head>
      <body className="antialiased bg-background text-text font-sans">
        <AuthProvider>
          <AppHeader />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
