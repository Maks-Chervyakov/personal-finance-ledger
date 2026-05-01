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
    "rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white";
  const activeStateClassName =
    activeClassName ??
    "border border-black/8 bg-stone-950 text-white shadow-sm";
  const inactiveStateClassName =
    inactiveClassName ??
    "border border-black/8 bg-white text-stone-600 hover:border-black/12 hover:bg-stone-100 hover:text-stone-950";

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
