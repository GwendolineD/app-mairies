"use client";

import { AuthCredentialsProvider } from "@/components/features/auth/auth-credentials-provider";

export function PublicAuthLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthCredentialsProvider>{children}</AuthCredentialsProvider>;
}
