"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createContext, startTransition, useEffect, useState } from "react";

import { loginUser, registerUser, type LoginInput, type RegisterInput } from "@/lib/api/auth";
import {
  clearSession,
  readSession,
  saveSession,
  type SessionState,
  type SessionUser,
} from "@/lib/auth/session";

type AuthContextValue = {
  isAuthenticated: boolean;
  isReady: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
  register: (input: RegisterInput) => Promise<void>;
  token: string | null;
  user: SessionUser | null;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<SessionState | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setSession(readSession());
      setIsReady(true);
    });
  }, []);

  const applySession = (nextSession: SessionState) => {
    saveSession(nextSession);
    queryClient.clear();
    setSession(nextSession);
  };

  const login = async (input: LoginInput) => {
    const response = await loginUser(input);
    applySession(response);
  };

  const register = async (input: RegisterInput) => {
    await registerUser(input);
  };

  const logout = () => {
    clearSession();
    queryClient.clear();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(session?.token),
        isReady,
        login,
        logout,
        register,
        token: session?.token ?? null,
        user: session?.user ?? null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
