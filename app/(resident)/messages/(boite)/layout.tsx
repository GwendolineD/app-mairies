import { MessagesInboxLayout } from "@/components/features/messages-inbox-layout";

export default function MessagesBoiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MessagesInboxLayout view="boite">{children}</MessagesInboxLayout>;
}
