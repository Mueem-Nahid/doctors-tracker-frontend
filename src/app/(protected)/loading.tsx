export default function ProtectedLoading() {
  return (
    <section aria-busy="true" className="page-content loading-content" role="status">
      <span className="sr-only">Loading your workspace</span>
      <div className="skeleton skeleton-heading" />
      <div className="skeleton skeleton-panel" />
    </section>
  );
}
