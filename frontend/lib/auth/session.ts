import {
  AUTH_TOKEN_COOKIE,
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
} from "@/lib/auth/constants";

export type SessionUser = {
  email: string;
  firstName: string;
  id: string;
  lastName: string;
};

export type SessionState = {
  token: string;
  user: SessionUser;
};

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const isBrowser = () => typeof window !== "undefined";

export const saveSession = (session: SessionState) => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, session.token);
  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(session.user));
  document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(session.token)}; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax`;
};

export const clearSession = () => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  document.cookie = `${AUTH_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
};

export const readSession = (): SessionState | null => {
  if (!isBrowser()) {
    return null;
  }

  const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  const rawUser = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);

  if (!token || !rawUser) {
    return null;
  }

  try {
    const user = JSON.parse(rawUser) as SessionUser;

    if (
      typeof user.id !== "string" ||
      typeof user.email !== "string" ||
      typeof user.firstName !== "string" ||
      typeof user.lastName !== "string"
    ) {
      clearSession();
      return null;
    }

    return { token, user };
  } catch {
    clearSession();
    return null;
  }
};

export const readToken = () => readSession()?.token ?? null;
