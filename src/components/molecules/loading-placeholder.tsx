export function LoadingPlaceholder({
  label,
  variant = "page",
}: {
  label: string;
  variant?: "page" | "standalone" | "table" | "compact" | "chart" | "profile";
}) {
  return (
    <div className={`loading-placeholder loading-placeholder-${variant}`}>
      <span className="sr-only" role="status">
        {label}
      </span>
      <div className="loading-placeholder-layout" aria-hidden="true">
        {variant === "profile" ? (
          <div className="loading-profile-header">
            <span className="skeleton skeleton-avatar" />
            <div>
              <span className="skeleton skeleton-heading" />
              <span className="skeleton skeleton-line" />
            </div>
          </div>
        ) : null}
        {variant === "table" ? (
          <>
            <div className="loading-table-row loading-table-header">
              <span className="skeleton" />
              <span className="skeleton" />
              <span className="skeleton" />
            </div>
            {[0, 1, 2, 3, 4].map((row) => (
              <div className="loading-table-row" key={row}>
                <span className="skeleton" />
                <span className="skeleton" />
                <span className="skeleton" />
              </div>
            ))}
          </>
        ) : (
          <div className="loading-surface">
            <span className="skeleton skeleton-heading" />
            <span className="skeleton skeleton-line" />
            {variant !== "compact" ? <span className="skeleton skeleton-panel" /> : null}
          </div>
        )}
      </div>
    </div>
  );
}
