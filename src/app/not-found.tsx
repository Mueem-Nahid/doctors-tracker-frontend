import Link from "next/link";
import { UiIcon } from "@/components/atoms/icons/ui-icon";
import { StatusPanel } from "@/components/molecules/status-panel";

export default function NotFound() {
  return (
    <main className="error-page">
      <StatusPanel
        heading="h1"
        tone="missing"
        title="Page not found"
        description="Check the address or return to your dashboard."
        actions={
          <Link className="button button-primary" href="/dashboard">
            Go to dashboard <UiIcon name="forward" />
          </Link>
        }
      />
    </main>
  );
}
