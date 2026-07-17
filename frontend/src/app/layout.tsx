import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavCartButton from "@/components/NavCartButton";
import SearchInput from "@/components/SearchInput";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PulseCart — AI-Powered Shopping",
  description: "Multi-agent orchestration for smarter e-commerce",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-text font-sans`}
      >
        {/* Navigation */}
        <nav className="sticky top-0 z-50 h-14 border-b border-border bg-surface/80 backdrop-blur-sm flex items-center px-4 gap-4">
          <a href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            <span className="text-xl">⚡</span> PulseCart
          </a>

          <div className="flex items-center gap-1 ml-4">
            <a href="/" className="px-3 py-1.5 text-sm text-muted hover:text-text hover:bg-white/5 rounded-lg transition-colors">
              🛍️ Shop
            </a>
            <a href="/manager" className="px-3 py-1.5 text-sm text-muted hover:text-text hover:bg-white/5 rounded-lg transition-colors">
              📊 Dashboard
            </a>
          </div>

          <div className="flex-1 max-w-md mx-auto">
            <SearchInput />
          </div>

          <div className="flex items-center gap-2">
            <NavCartButton />
            <button className="px-3 py-1.5 text-sm text-muted hover:text-text hover:bg-white/5 rounded-lg transition-colors">
              Sign In
            </button>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}
