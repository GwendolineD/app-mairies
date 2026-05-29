"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AuthCredentials = {
  email: string;
  password: string;
};

type AuthCredentialsContextValue = AuthCredentials & {
  setCredentials: (patch: Partial<AuthCredentials>) => void;
  clearCredentials: () => void;
};

const emptyCredentials: AuthCredentials = {
  email: "",
  password: "",
};

const AuthCredentialsContext =
  createContext<AuthCredentialsContextValue | null>(null);

export function AuthCredentialsProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentialsState] =
    useState<AuthCredentials>(emptyCredentials);

  const setCredentials = useCallback((patch: Partial<AuthCredentials>) => {
    setCredentialsState((prev) => ({ ...prev, ...patch }));
  }, []);

  const clearCredentials = useCallback(() => {
    setCredentialsState(emptyCredentials);
  }, []);

  const value = useMemo(
    () => ({
      ...credentials,
      setCredentials,
      clearCredentials,
    }),
    [credentials, setCredentials, clearCredentials],
  );

  return (
    <AuthCredentialsContext.Provider value={value}>
      {children}
    </AuthCredentialsContext.Provider>
  );
}

export function useAuthCredentials() {
  const context = useContext(AuthCredentialsContext);
  if (!context) {
    throw new Error(
      "useAuthCredentials must be used within AuthCredentialsProvider",
    );
  }
  return context;
}
