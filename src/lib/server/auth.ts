import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Admin = {
  _id: string;
  name: string;
  email: string;
  role: "admin";
};

const backendOrigin =
  process.env.BACKEND_ORIGIN ??
  (process.env.NODE_ENV === "development" ? "http://localhost:4000" : undefined);
const cookieNames = ["doctor_tracker_session", "__Host-doctor_tracker_session"];

export async function getCurrentAdmin(): Promise<Admin | null> {
  if (!backendOrigin) throw new Error("BACKEND_ORIGIN is required for session checks");

  const cookieStore = await cookies();
  const sessionCookie = cookieNames
    .map((name) => cookieStore.get(name))
    .find((cookie) => cookie !== undefined);

  if (!sessionCookie) return null;

  try {
    const response = await fetch(`${backendOrigin}/api/v1/auth/me`, {
      headers: { cookie: `${sessionCookie.name}=${sessionCookie.value}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { data: Admin };
    return payload.data;
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<Admin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login?next=/");
  return admin;
}
