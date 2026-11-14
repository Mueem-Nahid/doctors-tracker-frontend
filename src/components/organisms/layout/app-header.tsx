"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Admin } from "@/types/auth";
import type { ReactNode } from "react";
import { InitialsAvatar } from "@/components/atoms/initials-avatar";
import { UiIcon } from "@/components/atoms/icons/ui-icon";
import { Brand } from "@/components/molecules/brand";
import { ThemeToggle } from "@/components/molecules/theme-toggle";

import { navigation } from "./navigation";

export function AppHeader({ admin, signOut }: { admin: Admin; signOut: ReactNode }) {
  const currentPath = usePathname();
  const section = navigation.find(
    ({ href }) => currentPath === href || currentPath.startsWith(`${href}/`),
  );

  return (
    <header className="topbar">
      <details className="mobile-navigation">
        <summary aria-label="Toggle navigation menu" className="mobile-nav-trigger">
          <UiIcon name="menu" />
        </summary>
        <nav aria-label="Mobile navigation" className="mobile-nav-panel">
          {navigation.map((item) => {
            const isActive = section === item;
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
                <span className="nav-icon">
                  <item.Icon />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </details>
      <Brand className="mobile-header-brand" />
      <div className="topbar-context">
        {section ? (
          <>
            <span className="nav-icon">
              <section.Icon />
            </span>
            {section.label}
          </>
        ) : null}
      </div>
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
