"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/button";
import { apiFetch, ApiError } from "@/lib/api";

export function LogoutButton() {
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
    } catch (logoutError) {
      setError(logoutError instanceof ApiError
        ? "Couldn't sign out. Try again."
        : "Couldn't connect to the sign-out service. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="logout-control">
      <Button className="logout-button" disabled={isSubmitting} onClick={logout} type="button" variant="outline">
        {isSubmitting ? "Signing out…" : "Sign out"}
      </Button>
      {error ? <span className="logout-error" role="alert">{error}</span> : null}
    </div>
  );
}
