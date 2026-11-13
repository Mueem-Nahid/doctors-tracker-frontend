export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 32 32">
      <rect x="1" y="1" width="30" height="30" rx="9" />
      <path d="M5.5 16h5l2.4-5 4.1 10 2.5-5h7" />
    </svg>
  );
}
