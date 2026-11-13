import type { ReactNode } from "react";

type FormFieldProps = {
  children: ReactNode;
  error?: string;
  htmlFor: string;
  label: string;
  required?: boolean;
};

export function FormField({ children, error, htmlFor, label, required = false }: FormFieldProps) {
  const errorId = `${htmlFor}-error`;

  return (
    <div className="form-field">
      <label className="form-label" htmlFor={htmlFor}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="field-error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
