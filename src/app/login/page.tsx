import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/server/auth";
import { LoginForm } from "@/components/organisms/auth/login-form";
import { AuthTemplate } from "@/components/templates/auth-template";

export const instant = false;

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

function getInternalReturnPath(value: string | string[] | undefined): string {
  if (typeof value !== "string" || /[\\\u0000-\u001f]/.test(value)) return "/";

  try {
    const destination = new URL(value, "http://doctor-tracker.invalid");
    if (destination.origin !== "http://doctor-tracker.invalid") return "/";
    return `${destination.pathname}${destination.search}`;
  } catch {
    return "/";
  }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <Suspense
      fallback={
        <div className="route-loading" role="status">
          Loading sign in…
        </div>
      }
    >
      <LoginPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginPageContent({ searchParams }: LoginPageProps) {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/dashboard");

  const params = await searchParams;
  const nextPath = getInternalReturnPath(params.next);

  return (
    <AuthTemplate>
      <div className="login-card">
        <h1 id="login-title">Sign in to your account</h1>
        <p className="login-intro">Use your administrator credentials to continue.</p>
        <LoginForm nextPath={nextPath} />
      </div>
    </AuthTemplate>
  );
}
