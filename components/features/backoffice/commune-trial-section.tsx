"use client";

import { useCallback, useState, useTransition } from "react";
import { ExternalLink, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/form-field";
import { StaffInviteModal } from "@/components/features/mairie/staff-invite-modal";
import { updateTrialMaxMembers } from "@/lib/actions/staff-invitation";
import { ROUTES } from "@/lib/constants/routes";
import type { AccessStatus } from "@/lib/types";

type Props = {
  communeId: string;
  accessStatus: AccessStatus;
  trialMaxMembers: number;
  currentMembersCount: number;
};

export function CommuneTrialSection({
  communeId,
  accessStatus,
  trialMaxMembers,
  currentMembersCount,
}: Props) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [maxMembers, setMaxMembers] = useState(String(trialMaxMembers));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isTrial = accessStatus === "trial";

  const handleUpdateMaxMembers = useCallback(() => {
    const num = parseInt(maxMembers, 10);
    if (isNaN(num) || num < 1) {
      setFeedback("Nombre invalide.");
      return;
    }
    startTransition(async () => {
      const res = await updateTrialMaxMembers(communeId, num);
      if (!res.success) {
        setFeedback(res.error);
      } else {
        setFeedback("Limite mise à jour.");
      }
    });
  }, [communeId, maxMembers]);

  if (!isTrial) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold leading-7 text-text">Mode essai</h2>

      <Card className="space-y-5 p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Adhérent·es
            </p>
            <p className="text-lg font-bold text-text">
              <Users className="mb-0.5 mr-1 inline size-4 text-muted" />
              {currentMembersCount}
              <span className="text-sm font-medium text-muted">
                {" "}/ {trialMaxMembers}
              </span>
            </p>
          </div>
          <div className="flex items-end gap-2">
            <FormField label="Limite max" className="w-24">
              <Input
                type="number"
                min={1}
                max={1000}
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
              />
            </FormField>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleUpdateMaxMembers}
              disabled={isPending}
            >
              Modifier
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus className="size-4" />
            Inviter
          </Button>
          <Button
            variant="secondary"
            size="sm"
            href={`${ROUTES.backoffice.utilisateurs}?tab=invitations&commune=${communeId}`}
          >
            <ExternalLink className="size-4" />
            Voir toutes les invitations
          </Button>
        </div>

        {feedback ? (
          <p className="text-xs font-medium text-purple">{feedback}</p>
        ) : null}
      </Card>

      <StaffInviteModal
        communeId={communeId}
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        variant="admin"
      />
    </section>
  );
}
