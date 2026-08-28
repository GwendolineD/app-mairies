"use client";

import { useState, useTransition } from "react";
import { Loader2, RotateCw, Trash2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { InvitationStatusBadge } from "@/components/features/backoffice/invitation-status-badge";
import { StaffInviteModal } from "@/components/features/mairie/staff-invite-modal";
import { resendInvitation, deleteInvitation } from "@/lib/actions/staff-invitation";
import { ROLE_LABELS } from "@/lib/constants/roles";
import { formatShortDate } from "@/lib/datetime";
import type { InvitationListRow } from "@/lib/queries/backoffice-invitations";
import type { MembershipRole } from "@/lib/types";

type Props = {
  communeId: string;
  invitations: InvitationListRow[];
  totalCount: number;
  page: number;
  limit: number;
  isTrial: boolean;
  currentMembersCount: number;
  trialMaxMembers: number;
};

export function MairieInvitationsList({
  communeId,
  invitations,
  totalCount,
  page,
  limit,
  isTrial,
  currentMembersCount,
  trialMaxMembers,
}: Props) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleResend = (inviteId: string) => {
    startTransition(async () => {
      setFeedback(null);
      const res = await resendInvitation(inviteId);
      if (res.success) {
        setFeedback("Invitation renvoyée.");
        router.refresh();
      } else {
        setFeedback(res.error);
      }
    });
  };

  const handleDelete = (inviteId: string) => {
    startTransition(async () => {
      setFeedback(null);
      const res = await deleteInvitation(inviteId);
      if (res.success) {
        setFeedback("Invitation supprimée.");
        setDeleteTarget(null);
        router.refresh();
      } else {
        setFeedback(res.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      {isTrial ? (
        <div className="flex items-center gap-2 rounded-sm bg-sun/10 px-4 py-2">
          <span className="text-sm font-semibold text-orange">
            {currentMembersCount} / {trialMaxMembers} testeurs
          </span>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted">
          {totalCount} invitation{totalCount !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          <UserPlus className="size-4" aria-hidden />
          <span className="md:hidden">Inviter</span>
          <span className="hidden md:inline">Inviter des habitants</span>
        </Button>
      </div>

      {feedback ? (
        <p className="text-xs font-medium text-purple">{feedback}</p>
      ) : null}

      {invitations.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-6 text-center">
          <p className="text-sm font-medium text-muted">
            Aucune invitation envoyée. Invitez vos premiers habitants !
          </p>
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus className="size-4" aria-hidden />
            <span className="md:hidden">Inviter</span>
            <span className="hidden md:inline">Inviter des habitants</span>
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {invitations.map((invite) => (
            <Card
              key={invite.id}
              className="flex flex-col gap-2 rounded-lg p-4 md:flex-row md:items-center md:justify-between md:gap-4"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-sm font-semibold text-text">
                  {invite.email}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span>
                    {ROLE_LABELS[invite.intendedRole as MembershipRole] ??
                      invite.intendedRole}
                  </span>
                  <span>·</span>
                  <InvitationStatusBadge status={invite.status} />
                </div>
                <p className="text-xs text-subtle">
                  Envoyée le {formatShortDate(invite.createdAt)}
                </p>
              </div>

              {invite.status === "pending" || invite.status === "expired" ? (
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleResend(invite.id)}
                    disabled={isPending}
                    className="px-3 py-1 md:px-4 md:py-1.5"
                  >
                    {isPending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <RotateCw className="size-4" aria-hidden />
                    )}
                    Renvoyer
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setDeleteTarget(invite.id)}
                    disabled={isPending}
                    className="px-3 py-1 text-coral hover:text-coral md:px-4 md:py-1.5"
                  >
                    <Trash2 className="size-4" aria-hidden />
                    Supprimer
                  </Button>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      {(() => {
        const totalPages = Math.max(1, Math.ceil(totalCount / limit));
        if (totalPages <= 1) return null;
        return (
          <div className="flex items-center justify-end gap-2 text-sm font-medium text-muted">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1 || isPending}
              onClick={() =>
                router.push(`?tab=invitations&page=${page - 1}`, { scroll: false })
              }
            >
              Précédent
            </Button>
            <span>
              Page {page} / {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages || isPending}
              onClick={() =>
                router.push(`?tab=invitations&page=${page + 1}`, { scroll: false })
              }
            >
              Suivant
            </Button>
          </div>
        );
      })()}

      <StaffInviteModal
        communeId={communeId}
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        variant="mairie"
        onSuccess={() => router.refresh()}
      />

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer l'invitation"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text">
            Cette invitation sera définitivement supprimée.
            Le lien envoyé ne fonctionnera plus.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
