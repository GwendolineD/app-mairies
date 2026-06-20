import { getConversationInbox } from "@/lib/data/messages";
import { AssetPlaceholder } from "@/components/ui/asset-placeholder";
import { Card } from "@/components/ui/card";
import { ConversationListItem } from "./conversation-list-item";
import { InboxRealtime } from "./inbox-realtime";

type Props = {
  communeId: string;
  currentUserId: string;
};

export async function ConversationList({ communeId, currentUserId }: Props) {
  const entries = await getConversationInbox(communeId);

  if (entries.length === 0) {
    return (
      <>
        <InboxRealtime currentUserId={currentUserId} />
        <Card className="space-y-3 p-6 text-center">
          <AssetPlaceholder
            description="Aucune conversation pour l'instant"
            className="min-h-32 flex-col rounded-3xl"
          />
          <p className="text-sm font-medium leading-5 text-muted">
            Contactez un·e voisin·e depuis une annonce, une initiative ou un
            événement pour démarrer une conversation chaleureuse.
          </p>
        </Card>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <InboxRealtime currentUserId={currentUserId} />
      {entries.map((entry) => (
        <ConversationListItem
          key={entry.id}
          entry={entry}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
}
