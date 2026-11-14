import { LoadingPlaceholder } from "@/components/molecules/loading-placeholder";
import { Suspense, type ReactNode } from "react";
import { AppShellTemplate } from "@/components/templates/app-shell-template";
import { requireAdmin } from "@/lib/server/auth";

export const instant = false;

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingPlaceholder label="Loading your workspace" variant="standalone" />}>
      <AuthenticatedWorkspace>{children}</AuthenticatedWorkspace>
    </Suspense>
  );
}

async function AuthenticatedWorkspace({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  return <AppShellTemplate admin={admin}>{children}</AppShellTemplate>;
}
