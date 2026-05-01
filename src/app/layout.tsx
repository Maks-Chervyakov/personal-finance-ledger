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
  description:
    "Личный учет расходов, доходов, переводов и обменов между счетами.",
};

function LogoMark() {
  return (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-black/8 bg-white shadow-sm">
      <svg
        viewBox="0 0 44 44"
        aria-hidden="true"
        className="h-9 w-9"
        role="img"
      >
        <defs>
          <linearGradient id="logoGradient" x1="8" y1="8" x2="36" y2="36">
            <stop offset="0" stopColor="#2d7d6f" />
            <stop offset="0.62" stopColor="#6f8f7a" />
            <stop offset="1" stopColor="#141414" />
          </linearGradient>
        </defs>
        <rect x="5" y="5" width="34" height="34" rx="13" fill="#fbfaf7" />
        <rect
          x="5"
          y="5"
          width="34"
          height="34"
          rx="13"
          fill="none"
          stroke="url(#logoGradient)"
          strokeWidth="2"
        />
        <path
          d="M14 28V19.4c0-1.5.9-2.7 2.2-3.2l1.7-.6c1.3-.5 2.7-.5 4 0l1.7.6c1.3.5 2.2 1.7 2.2 3.2V28"
          stroke="url(#logoGradient)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M16.5 27.8V22.5M22 27.8V19.8M27.5 27.8V23.8"
          stroke="url(#logoGradient)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="22" cy="30.5" r="2.2" fill="url(#logoGradient)" />
      </svg>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground">
        <div className="relative isolate min-h-screen">
          <header className="sticky top-0 z-40 border-b border-black/5 bg-white/88 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:px-8">
              <Link href="/" className="min-w-0 flex-1 lg:flex-none">
                <div className="flex min-w-0 items-center gap-3">
                  <LogoMark />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-900">
                      Expense Tracker
                    </p>
                    <p className="truncate text-sm text-stone-500">
                      Учет операций и счетов
                    </p>
                  </div>
                </div>
              </Link>

              <nav className="order-3 hidden w-full items-center gap-2 min-[560px]:flex lg:order-none lg:w-auto lg:flex-1 lg:justify-center">
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
                className="hidden rounded-full border border-black/8 bg-stone-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800 min-[760px]:inline-flex"
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
            className="fixed bottom-20 right-4 z-40 grid h-14 w-14 place-items-center rounded-full border border-black/8 bg-stone-950 text-2xl font-light text-white shadow-lg transition hover:scale-[1.02] min-[560px]:hidden"
          >
            +
          </Link>

          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-white/94 px-3 pb-4 pt-3 backdrop-blur min-[560px]:hidden">
            <nav className="mx-auto grid max-w-sm grid-cols-3 gap-2 rounded-2xl border border-black/8 bg-white p-2 shadow-lg">
              <NavLink
                href="/"
                label="Обзор"
                className="rounded-xl px-3 py-3 text-center text-xs font-semibold transition"
                activeClassName="bg-stone-950 text-white shadow-sm"
                inactiveClassName="text-stone-600 hover:bg-stone-100 hover:text-stone-950"
              />
              <NavLink
                href="/operations"
                label="Операции"
                match="prefix"
                className="rounded-xl px-3 py-3 text-center text-xs font-semibold transition"
                activeClassName="bg-stone-950 text-white shadow-sm"
                inactiveClassName="text-stone-600 hover:bg-stone-100 hover:text-stone-950"
              />
              <NavLink
                href="/manage/accounts"
                label="Управление"
                match="prefix"
                className="rounded-xl px-3 py-3 text-center text-xs font-semibold transition"
                activeClassName="bg-stone-950 text-white shadow-sm"
                inactiveClassName="text-stone-600 hover:bg-stone-100 hover:text-stone-950"
              />
            </nav>
          </div>
        </div>
      </body>
    </html>
  );
}
