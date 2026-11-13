import { Suspense, type ReactNode } from "react";
import { AppShellTemplate } from "@/components/templates/app-shell-template";
import { requireAdmin } from "@/lib/server/auth";

export const instant = false;

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="route-loading" role="status">
          Loading your workspace…
        </div>
      }
    >
      <AuthenticatedWorkspace>{children}</AuthenticatedWorkspace>
    </Suspense>
  );
}

async function AuthenticatedWorkspace({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  return <AppShellTemplate admin={admin}>{children}</AppShellTemplate>;
}
