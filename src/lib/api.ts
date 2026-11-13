export type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string>;
  };
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`/api${path}`, {
    ...init,
    headers,
    credentials: "same-origin",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ApiErrorBody;
    const code = payload.error?.code ?? "INTERNAL";

    if (
      response.status === 401 &&
      code !== "INVALID_CREDENTIALS" &&
      typeof window !== "undefined"
    ) {
      const returnPath = `${window.location.pathname}${window.location.search}`;
      window.dispatchEvent(
        new CustomEvent("doctor-tracker:session-expired", {
          detail: { returnPath },
        }),
      );
    }

    throw new ApiError(
      response.status,
      code,
      payload.error?.message ?? "Something went wrong",
      payload.error?.fields,
    );
  }

  if (response.status === 204) return undefined as T;
  const payload = (await response.json()) as { data: T };
  return payload.data;
}
