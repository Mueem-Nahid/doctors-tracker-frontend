"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Admin } from "@/types/auth";
import type { ReactNode } from "react";
import { InitialsAvatar } from "@/components/atoms/initials-avatar";
import { Brand } from "@/components/molecules/brand";
import { ThemeToggle } from "@/components/molecules/theme-toggle";

const navigation = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Doctors", href: "/doctors" },
  { label: "Patients", href: "/patients" },
];

export function AppHeader({ admin, signOut }: { admin: Admin; signOut: ReactNode }) {
  const currentPath = usePathname();

  return (
    <header className="topbar">
      <details className="mobile-navigation">
        <summary aria-label="Toggle navigation menu" className="mobile-nav-trigger">
          <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M3 5h14M3 10h14M3 15h14" /></svg>
          <span className="sr-only">Navigation</span>
        </summary>
        <nav aria-label="Mobile navigation" className="mobile-nav-panel">
          {navigation.map((item) => {
            const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);
            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={isActive ? "mobile-nav-link mobile-nav-link-active" : "mobile-nav-link"}
                href={item.href}
                key={item.href}
                onClick={(event) => {
                  const menu = event.currentTarget.closest("details");
                  if (menu) menu.open = false;
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </details>
      <Brand className="mobile-header-brand" />
      <div className="topbar-context">Care operations</div>
      <div className="topbar-actions">
        <ThemeToggle />
        <div className="user-menu">
          <InitialsAvatar name={admin.name} />
          <span className="user-name">{admin.name}</span>
          {signOut}
        </div>
      </div>
    </header>
  );
}
