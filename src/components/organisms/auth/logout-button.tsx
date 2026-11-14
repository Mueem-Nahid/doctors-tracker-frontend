"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { IconButton } from "@/components/atoms/icon-button";
import { apiFetch, ApiError } from "@/lib/api";

export function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setIsSubmitting(true);
    setError("");
    try {
      await apiFetch<void>("/auth/logout", { method: "POST" });
      await queryClient.cancelQueries();
      queryClient.clear();
      router.replace("/login");
      router.refresh();
    } catch (logoutError) {
      setError(
        logoutError instanceof ApiError
          ? "Couldn't sign out. Try again."
          : "Couldn't connect to the sign-out service. Try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="logout-control">
      <IconButton
        icon="logout"
        label={isSubmitting ? "Signing out…" : "Sign out"}
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        onClick={logout}
        variant="outline"
      />
      {error ? (
        <span className="logout-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
