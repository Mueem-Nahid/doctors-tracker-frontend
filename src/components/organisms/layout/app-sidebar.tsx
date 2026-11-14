"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Admin } from "@/types/auth";
import { InitialsAvatar } from "@/components/atoms/initials-avatar";
import { Brand } from "@/components/molecules/brand";
import { navigation } from "./navigation";

export function AppSidebar({ admin }: { admin: Admin }) {
  const currentPath = usePathname();

  return (
    <aside className="sidebar" aria-label="Workspace sidebar">
      <Brand className="sidebar-brand" />
      <nav aria-label="Main navigation" className="nav-list">
        {navigation.map((item) => {
          const Icon = item.Icon;
          const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);
          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={`nav-link${isActive ? " nav-link-active" : ""}`}
              href={item.href}
              key={item.href}
              title={item.label}
            >
              <span aria-hidden="true" className="nav-icon">
                <Icon />
              </span>
              <span className="nav-link-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <footer className="sidebar-footer">
        <InitialsAvatar name={admin.name} />
        <span className="admin-label">
          <strong>{admin.name}</strong>
          <small>Administrator</small>
        </span>
      </footer>
    </aside>
  );
}
