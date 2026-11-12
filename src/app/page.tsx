import Link from "next/link";
import { requireAdmin } from "@/lib/server/auth";
import LogoutButton from "@/components/logout-button";

const navigation = ["Dashboard", "Doctors", "Patients"];

export default async function Home() {
  const admin = await requireAdmin();
  return (
    <div className="app-frame">
      <aside className="sidebar" aria-label="Main navigation">
        <Link className="brand" href="/" aria-label="Doctor Tracker home">
          <span className="brand-mark" aria-hidden="true">+</span>
          <span>Doctor Tracker</span>
        </Link>

        <p className="nav-caption">Workspace</p>
        <nav className="nav-list">
          {navigation.map((item, index) => (
            <Link
              aria-current={index === 0 ? "page" : undefined}
              className={`nav-link${index === 0 ? " nav-link-active" : ""}`}
              href={index === 0 ? "/" : `/${item.toLowerCase()}`}
              key={item}
            >
              <span className="nav-indicator" aria-hidden="true" />
              {item}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="avatar" aria-hidden="true">A</span>
          <span className="admin-label">
            <strong>{admin.name}</strong>
            <small>Administrator</small>
          </span>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <span className="topbar-context">Care operations</span>
          <div className="topbar-actions">
            <span className="session-status"><span /> Signed in</span>
            <LogoutButton />
          </div>
        </header>

        <section className="page-content" aria-labelledby="page-title">
          <div className="page-heading">
            <div>
              <p className="eyebrow">OVERVIEW</p>
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
      </main>
    </div>
  );
}
