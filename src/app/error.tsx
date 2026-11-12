"use client";

import { Button } from "@/components/atoms/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="error-page" role="alert">
      <p className="eyebrow">Something went wrong</p>
      <h1>We couldn’t load this page.</h1>
      <p>Check your connection and try again.</p>
      <Button onClick={reset} type="button">Try again</Button>
    </main>
  );
}
