import Link from "next/link";

export default function NotFound() {
  return (
    <main className="error-page">
      <p className="eyebrow">404 · Page not found</p>
      <h1>This page isn’t available.</h1>
      <p>Check the address or return to your dashboard.</p>
      <Link className="button button-primary error-action" href="/dashboard">Go to dashboard</Link>
    </main>
  );
}
