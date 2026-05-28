import { AuthPageShell } from "@/components/features/auth/auth-page-shell";

export function ConnexionLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthPageShell mode="connexion">{children}</AuthPageShell>;
}
