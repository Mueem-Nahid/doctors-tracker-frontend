import Link from "next/link";
import type { ReactNode } from "react";
import type { Admin } from "@/lib/server/auth";
import LogoutButton from "@/components/logout-button";

const navigation = [
  { label: "Dashboard", href: "/" },
  { label: "Doctors", href: "/doctors" },
  { label: "Patients", href: "/patients" },
];

export default function AppShell({ admin, children }: { admin: Admin; children: ReactNode }) {
  return (
    <div className="app-frame">
      <aside className="sidebar" aria-label="Main navigation">
        <Link className="brand" href="/" aria-label="Doctor Tracker home">
          <span className="brand-mark" aria-hidden="true">+</span>
          <span>Doctor Tracker</span>
        </Link>
        <p className="nav-caption">Workspace</p>
        <nav className="nav-list">
          {navigation.map((item, index) => (
            <Link
              aria-current={index === 0 ? "page" : undefined}
              className={`nav-link${index === 0 ? " nav-link-active" : ""}`}
              href={item.href}
              key={item.href}
            >
              <span className="nav-indicator" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="avatar" aria-hidden="true">{admin.name.slice(0, 1).toUpperCase()}</span>
          <span className="admin-label">
            <strong>{admin.name}</strong>
            <small>Administrator</small>
          </span>
        </div>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <span className="topbar-context">Care operations</span>
          <div className="topbar-actions">
            <span className="session-status"><span /> Signed in</span>
            <LogoutButton />
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
