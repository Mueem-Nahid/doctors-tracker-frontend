"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function LogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setIsSubmitting(true);
    setError("");
    try {
      await apiFetch<void>("/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Couldn't connect to the sign-out service. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="logout-control">
      <button className="logout-button" type="button" onClick={logout} disabled={isSubmitting}>
        {isSubmitting ? "Signing out…" : "Sign out"}
      </button>
      {error ? <span className="logout-error" role="alert">{error}</span> : null}
    </div>
  );
}
