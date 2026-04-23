import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { NavLink } from "@/components/nav-link";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Личный учет расходов, доходов, переводов и обменов между счетами.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-8 rounded-3xl border border-white/10 bg-slate-900/75 px-6 py-5 shadow-2xl shadow-slate-950/30 backdrop-blur">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Expense Tracker</p>
                <h1 className="mt-2 text-2xl font-semibold text-white">Учет денег по счетам, валютам и категориям</h1>
              </div>
              <nav className="flex flex-wrap gap-2">
                <NavLink href="/" label="Дашборд" />
                <NavLink href="/accounts" label="Счета" />
                <NavLink href="/categories" label="Категории" />
              </nav>
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
