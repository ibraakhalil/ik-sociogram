import { readToken } from "@/lib/auth/session";
import type { ApiErrorResponse } from "@/lib/api/types";
import { env } from "@/lib/env";

const API_BASE_URL = env.apiBaseUrl;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  body?: BodyInit | null;
  headers?: HeadersInit;
  method?: "DELETE" | "GET" | "POST";
  token?: string | null;
};

export const apiFetch = async <T>(path: string, options: RequestOptions = {}) => {
  const headers = new Headers(options.headers);
  const isFormDataBody = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!headers.has("Content-Type") && options.body && !isFormDataBody) {
    headers.set("Content-Type", "application/json");
  }

  const token = options.token ?? readToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    body: options.body,
    headers,
    method: options.method ?? "GET",
  });

  if (!response.ok) {
    let message = "Something went wrong.";

    try {
      const data = (await response.json()) as ApiErrorResponse;
      if (typeof data.error === "string") {
        message = data.error;
      }
    } catch {
      message = response.statusText || message;
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
};
