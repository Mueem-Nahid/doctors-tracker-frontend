import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentAdmin } from "@/lib/server/auth";
import LoginForm from "./login-form";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/");

  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/";

  return (
    <main className="login-page">
      <section className="login-brand" aria-label="Doctor Tracker">
        <Link className="brand login-logo" href="/">
          <span className="brand-mark" aria-hidden="true">+</span>
          <span>Doctor Tracker</span>
        </Link>
        <div className="login-promise">
          <p className="eyebrow">CLINIC ADMINISTRATION</p>
          <h1>Care operations,<br />clearly.</h1>
          <p>One calm place to manage doctors, patients, and daily clinic activity.</p>
        </div>
        <span className="login-brand-note">Private workspace for authorized administrators</span>
      </section>
      <section className="login-content" aria-labelledby="login-title">
        <div className="login-card">
          <p className="eyebrow">WELCOME BACK</p>
          <h2 id="login-title">Sign in to your account</h2>
          <p className="login-intro">Use your administrator credentials to continue.</p>
          <LoginForm nextPath={nextPath} />
        </div>
      </section>
    </main>
  );
}
