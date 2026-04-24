import { apiFetch } from "@/lib/api/client";
import type { AuthResponse } from "@/lib/api/types";

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  firstName: string;
  lastName: string;
};

export const loginUser = (input: LoginInput) =>
  apiFetch<AuthResponse>("/auth/login", {
    body: JSON.stringify(input),
    method: "POST",
    token: null,
  });

export const registerUser = (input: RegisterInput) =>
  apiFetch<{ message: string }>("/auth/register", {
    body: JSON.stringify(input),
    method: "POST",
    token: null,
  });
