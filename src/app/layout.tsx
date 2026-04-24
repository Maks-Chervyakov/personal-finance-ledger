import type { Metadata } from "next";
import Link from "next/link";
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
        <div className="relative isolate min-h-screen overflow-x-hidden">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <Link href="/" className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-white shadow-lg shadow-cyan-950/40">
                    ET
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/70">
                      Expense Tracker
                    </p>
                    <p className="truncate text-sm text-slate-300">
                      Обзор денег, операций и справочников
                    </p>
                  </div>
                </div>
              </Link>

              <nav className="hidden items-center gap-2 md:flex">
                <NavLink href="/" label="Обзор" />
                <NavLink href="/operations" label="Операции" match="prefix" />
                <NavLink
                  href="/manage/accounts"
                  label="Управление"
                  match="prefix"
                />
              </nav>

              <Link
                href="/operations/new"
                className="hidden rounded-full border border-cyan-400/30 bg-cyan-400/12 px-4 py-2 text-sm font-medium text-cyan-50 shadow-lg shadow-cyan-950/40 transition hover:border-cyan-300/50 hover:bg-cyan-400/18 md:inline-flex"
              >
                Новая операция
              </Link>
            </div>
          </header>

          <div className="mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-7xl flex-col px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
            <main className="page-shell flex-1">{children}</main>
          </div>

          <Link
            href="/operations/new"
            aria-label="Новая операция"
            className="fixed bottom-20 right-4 z-40 grid h-14 w-14 place-items-center rounded-full border border-cyan-300/30 bg-cyan-400 text-2xl font-light text-slate-950 shadow-2xl shadow-cyan-950/50 transition hover:scale-[1.02] md:hidden"
          >
            +
          </Link>

          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-slate-950/92 px-3 pb-4 pt-3 backdrop-blur xl:hidden md:hidden">
            <nav className="mx-auto grid max-w-sm grid-cols-3 gap-2 rounded-[28px] border border-white/10 bg-white/5 p-2">
              <NavLink
                href="/"
                label="Обзор"
                className="rounded-2xl px-3 py-3 text-center text-xs font-medium transition"
                activeClassName="bg-white text-slate-950 shadow-lg shadow-white/20"
                inactiveClassName="text-slate-400 hover:bg-white/5 hover:text-white"
              />
              <NavLink
                href="/operations"
                label="Операции"
                match="prefix"
                className="rounded-2xl px-3 py-3 text-center text-xs font-medium transition"
                activeClassName="bg-white text-slate-950 shadow-lg shadow-white/20"
                inactiveClassName="text-slate-400 hover:bg-white/5 hover:text-white"
              />
              <NavLink
                href="/manage/accounts"
                label="Управление"
                match="prefix"
                className="rounded-2xl px-3 py-3 text-center text-xs font-medium transition"
                activeClassName="bg-white text-slate-950 shadow-lg shadow-white/20"
                inactiveClassName="text-slate-400 hover:bg-white/5 hover:text-white"
              />
            </nav>
          </div>
        </div>
      </body>
    </html>
  );
}
