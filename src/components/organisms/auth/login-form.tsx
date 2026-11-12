"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { loginSchema } from "@doctor-tracker/contracts";
import { Button } from "@/components/atoms/button";
import { TextInput } from "@/components/atoms/text-input";
import { FormField } from "@/components/molecules/form-field";
import { apiFetch, ApiError } from "@/lib/api";

type LoginFormProps = { nextPath: string };

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const errorRef = useRef<HTMLParagraphElement>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      const nextFieldErrors: { email?: string; password?: string } = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "email") nextFieldErrors.email = "Enter a valid email address";
        if (issue.path[0] === "password") nextFieldErrors.password = "Enter your password";
      }
      setFieldErrors(nextFieldErrors);
      setError("Review the highlighted fields");
      setIsSubmitting(false);
      return;
    }

    setFieldErrors({});
    try {
      await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      router.replace(nextPath);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof ApiError && submitError.code === "INVALID_CREDENTIALS"
        ? "Invalid email or password"
        : "Couldn't sign in. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form aria-describedby={error ? "login-error" : undefined} className="login-form" onSubmit={handleSubmit}>
      <FormField error={fieldErrors.email} htmlFor="email" label="Email" required>
        <TextInput
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-required="true"
          autoComplete="username"
          id="email"
          maxLength={254}
          name="email"
          required
          type="email"
        />
      </FormField>
      <FormField error={fieldErrors.password} htmlFor="password" label="Password" required>
        <div className="password-control">
          <TextInput
            aria-describedby={fieldErrors.password ? "password-error" : undefined}
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-required="true"
            autoComplete="current-password"
            id="password"
            maxLength={128}
            name="password"
            required
            type={showPassword ? "text" : "password"}
          />
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="password-toggle"
            onClick={() => setShowPassword((shown) => !shown)}
            type="button"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </FormField>
      {error ? <p className="login-error" id="login-error" ref={errorRef} role="alert" tabIndex={-1}>{error}</p> : null}
      <Button className="login-submit" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
