export default function DashboardPage() {
  return (
    <section className="page-content" aria-labelledby="page-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 id="page-title">Dashboard</h1>
          <p className="page-description">Your clinic overview will appear here.</p>
        </div>
        <span className="date-pill">Last 30 days</span>
      </div>
      <div className="setup-card">
        <span className="setup-mark" aria-hidden="true">✓</span>
        <div>
          <h2>Application shell is ready</h2>
          <p>Doctor and patient activity will appear once the API features are connected.</p>
        </div>
      </div>
    </section>
  );
}
