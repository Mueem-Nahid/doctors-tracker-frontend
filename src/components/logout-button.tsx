"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      if (!response.ok) {
        setError("Couldn't sign out. Try again.");
        return;
      }
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
