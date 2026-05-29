import { PublicAuthLayoutClient } from "@/components/features/auth/public-auth-layout-client";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicAuthLayoutClient>
      <div className="flex min-h-[calc(100dvh-1px)] flex-1 flex-col">{children}</div>
    </PublicAuthLayoutClient>
  );
}
