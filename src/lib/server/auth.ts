import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Admin } from "@/types/auth";

export type { Admin } from "@/types/auth";

const backendOrigin =
  process.env.BACKEND_ORIGIN ??
  (process.env.NODE_ENV === "development" ? "http://127.0.0.1:4000" : undefined);
const cookieNames = ["doctor_tracker_session", "__Host-doctor_tracker_session"];

export async function getCurrentAdmin(): Promise<Admin | null> {
  if (!backendOrigin) throw new Error("BACKEND_ORIGIN is required for session checks");

  const cookieStore = await cookies();
  const sessionCookie = cookieNames
    .map((name) => cookieStore.get(name))
    .find((cookie) => cookie !== undefined);

  if (!sessionCookie) return null;

  const response = await fetch(`${backendOrigin}/api/v1/auth/me`, {
    headers: { cookie: `${sessionCookie.name}=${sessionCookie.value}` },
    cache: "no-store",
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("The authentication service could not verify this session");

  const payload = (await response.json()) as { data: Admin };
  return payload.data;
}

export async function requireAdmin(): Promise<Admin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login?next=/dashboard");
  return admin;
}
