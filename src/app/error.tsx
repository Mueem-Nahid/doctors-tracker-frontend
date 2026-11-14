"use client";

import { RetryButton, StatusPanel } from "@/components/molecules/status-panel";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="error-page">
      <StatusPanel
        heading="h1"
        tone="error"
        title="Couldn’t load this page"
        description="Try again to reload the page."
        actions={<RetryButton onRetry={reset} />}
      />
    </main>
  );
}
