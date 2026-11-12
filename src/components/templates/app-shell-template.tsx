import type { ReactNode } from "react";
import type { Admin } from "@/types/auth";
import { LogoutButton } from "@/components/organisms/auth/logout-button";
import { AppHeader } from "@/components/organisms/layout/app-header";
import { AppSidebar } from "@/components/organisms/layout/app-sidebar";

export function AppShellTemplate({
  admin,
  children,
}: {
  admin: Admin;
  children: ReactNode;
}) {
  return (
    <div className="app-frame">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <AppSidebar admin={admin} />
      <div className="main-panel">
        <AppHeader admin={admin} signOut={<LogoutButton />} />
        <main id="main-content" tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}
