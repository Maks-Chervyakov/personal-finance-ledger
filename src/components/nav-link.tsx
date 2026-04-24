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

  const baseClassName = className ?? "rounded-full px-4 py-2 text-sm font-medium transition";
  const activeStateClassName =
    activeClassName ?? "bg-blue-500 text-white shadow-lg shadow-blue-500/30";
  const inactiveStateClassName =
    inactiveClassName ?? "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white";

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
