import type { ReactNode } from "react";
import { Brand } from "@/components/molecules/brand";

export function AuthTemplate({ children }: { children: ReactNode }) {
  return (
    <main className="login-page">
      <a className="skip-link" href="#login-content">
        Skip to sign in form
      </a>
      <section className="login-brand" aria-label="Doctor Tracker">
        <Brand className="login-brand-link" />
        <div className="login-promise">
          <p className="eyebrow">Clinic administration</p>
          <h2>
            Care operations,
            <br />
            clearly.
          </h2>
          <p>One calm place to manage doctors, patients, and daily clinic activity.</p>
        </div>
        <span className="login-brand-note">Private workspace for authorized administrators</span>
      </section>
      <section
        aria-labelledby="login-title"
        className="login-content"
        id="login-content"
        tabIndex={-1}
      >
        {children}
      </section>
    </main>
  );
}
