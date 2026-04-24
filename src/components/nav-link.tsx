"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinkProps = {
  href: string;
  label: string;
  match?: "exact" | "prefix";
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  prefetch?: boolean;
};

export function NavLink({
  href,
  label,
  match = "exact",
  className,
  activeClassName,
  inactiveClassName,
  prefetch,
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive =
    match === "prefix"
      ? pathname === href || pathname.startsWith(`${href}/`)
      : pathname === href;

  const baseClassName =
    className ??
    "rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/55 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";
  const activeStateClassName =
    activeClassName ??
    "border border-cyan-200/40 bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/30";
  const inactiveStateClassName =
    inactiveClassName ??
    "border border-white/12 bg-white/6 text-slate-200 hover:border-white/22 hover:bg-white/10 hover:text-white";

  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={`${baseClassName} ${isActive ? activeStateClassName : inactiveStateClassName}`}
    >
      {label}
    </Link>
  );
}
