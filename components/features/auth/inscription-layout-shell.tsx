import { AuthPageShell } from "@/components/features/auth/auth-page-shell";

export function InscriptionLayoutShell({
  children,
  centerContent = false,
}: {
  children: React.ReactNode;
  centerContent?: boolean;
}) {
  return <AuthPageShell centerContent={centerContent}>{children}</AuthPageShell>;
}
