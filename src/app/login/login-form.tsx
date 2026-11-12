"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { loginSchema } from "@doctor-tracker/contracts";
import { apiFetch, ApiError } from "@/lib/api";

type LoginFormProps = { nextPath: string };

export default function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      const parsed = loginSchema.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
      });
      if (!parsed.success) {
        setError("Enter a valid email and password");
        return;
      }

      await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setError(error instanceof ApiError && error.status === 401
        ? "Invalid email or password"
        : "Couldn't sign in. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" autoComplete="username" required maxLength={254} />
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required maxLength={128} />
      {error ? <p className="login-error" role="alert">{error}</p> : null}
      <button className="login-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
