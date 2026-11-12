import { Suspense, type ReactNode } from "react";
import AppShell from "@/components/app-shell";
import { requireAdmin } from "@/lib/server/auth";

export const instant = false;

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="route-loading" role="status">Loading your workspace…</div>}>
      <AuthenticatedWorkspace>{children}</AuthenticatedWorkspace>
    </Suspense>
  );
}

async function AuthenticatedWorkspace({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  return <AppShell admin={admin}>{children}</AppShell>;
}
