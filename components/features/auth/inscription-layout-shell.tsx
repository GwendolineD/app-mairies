import { AuthPageShell } from "@/components/features/auth/auth-page-shell";

export function InscriptionLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthPageShell mode="inscription">{children}</AuthPageShell>;
}
