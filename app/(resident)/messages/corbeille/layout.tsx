import { MessagesInboxLayout } from "@/components/features/messages-inbox-layout";

export default function MessagesCorbeilleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MessagesInboxLayout view="corbeille">{children}</MessagesInboxLayout>
  );
}
