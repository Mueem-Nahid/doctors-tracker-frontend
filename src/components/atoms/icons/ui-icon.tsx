import type { ReactNode } from "react";

const glyphs = {
  moon: <path d="M20.9 13.4A9 9 0 0 1 10.6 3.1a9 9 0 1 0 10.3 10.3Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  logout: <path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5m-1-8h12m-4-4 4 4-4 4" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="5.5" />
      <path d="m15 15 4.5 4.5" />
    </>
  ),
  edit: <path d="m14 6 4 4m-8 10H4v-6L15 3l6 6L10 20Z" />,
  trash: <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  previous: <path d="m14 6-6 6 6 6" />,
  next: <path d="m10 6 6 6-6 6" />,
  back: <path d="M19 12H5m6-6-6 6 6 6" />,
  forward: <path d="M5 12h14m-6-6 6 6-6 6" />,
  table: <path d="M4 5h16v14H4zM4 10h16M4 14.5h16M10 10v9" />,
  chart: <path d="M4 4v16h16M8 15l4-5 4 2 4-6" />,
  calendar: <path d="M4 6h16v14H4zM8 4v4m8-4v4M4 11h16" />,
  email: <path d="M3 5h18v14H3zM3 7l9 6 9-6" />,
  phone: (
    <path d="M6 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-2l-5-2-1.5 2A14 14 0 0 1 6 9.5L8 8 6 3Z" />
  ),
  eye: (
    <>
      <path d="M3 12s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6Z" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  eyeOff: (
    <path d="m4 4 16 16M10 6.2c.6-.1 1.3-.2 2-.2 6 0 9 6 9 6a13 13 0 0 1-2.2 2.7M6 7.8a14 14 0 0 0-3 4.2s3 6 9 6c1.3 0 2.5-.3 3.5-.7" />
  ),
  retry: <path d="M20 11a8 8 0 1 0-2 6m2-12v6h-6" />,
} satisfies Record<string, ReactNode>;

export function UiIcon({ name }: { name: keyof typeof glyphs }) {
  return (
    <svg aria-hidden="true" className="ui-icon" fill="none" viewBox="0 0 24 24">
      {glyphs[name]}
    </svg>
  );
}
