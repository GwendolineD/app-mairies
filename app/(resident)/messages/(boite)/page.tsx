import { MessagesInboxIndex } from "@/components/features/messages-inbox-index";

export default function MessagesBoitePage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <MessagesInboxIndex view="boite" searchParams={props.searchParams} />;
}
