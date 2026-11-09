import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";

/**
 * Root layout of the messages area. Static on purpose (no data access) so it
 * never blocks navigation and persists across every child-segment change.
 */
export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageStack gap="2">
      <PageHeading
        title="Messages"
        subtitle="Vos échanges autour des annonces, idées et événements."
      />
      {children}
    </PageStack>
  );
}
