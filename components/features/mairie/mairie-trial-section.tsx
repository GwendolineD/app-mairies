"use client";

import { useMemo, useState, useTransition } from "react";
import { Copy, Loader2, Mail, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import {
  regenerateTrialCodeAsMairie,
  sendTrialInvitations,
} from "@/lib/actions/trial-invitation";
import type { AccessStatus } from "@/lib/types";
import { hasAtLeastOneValidEmail } from "@/lib/utils/parse-email-list";

type Props = {
  communeId: string;
  accessStatus: AccessStatus;
  trialAccessCode: string | null;
  trialMaxMembers: number;
  currentMembersCount: number;
};

export function MairieTrialSection({
  communeId,
  accessStatus,
  trialAccessCode,
  trialMaxMembers,
  currentMembersCount,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [emails, setEmails] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [sendingInvites, setSendingInvites] = useState(false);
  const [isPending, startTransition] = useTransition();
  const canSendInvites = useMemo(
    () => hasAtLeastOneValidEmail(emails),
    [emails],
  );

  if (accessStatus !== "trial") return null;

  const copyCode = async () => {
    if (!trialAccessCode) return;
    await navigator.clipboard.writeText(trialAccessCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    startTransition(async () => {
      const res = await regenerateTrialCodeAsMairie(communeId);
      if (!res.success) {
        setFeedback(res.error);
      } else {
        setFeedback("Nouveau code généré.");
      }
      setRegenOpen(false);
    });
  };

  const handleSendInvitations = async () => {
    setSendingInvites(true);
    try {
      const res = await sendTrialInvitations(communeId, emails);
      if (!res.success) {
        setFeedback(res.error);
      } else {
        setFeedback(`${res.sentCount ?? 0} invitation(s) envoyée(s).`);
        setEmails("");
        setInviteOpen(false);
      }
    } finally {
      setSendingInvites(false);
    }
  };

  return (
    <>
      <Card className="space-y-5 p-6">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-sun/15">
            <Users className="size-4 text-orange" />
          </div>
          <h2 className="text-lg font-semibold text-text">
            Mode essai
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Code d&apos;accès
            </p>
            <p className="font-mono text-2xl font-bold tracking-widest text-purple">
              {trialAccessCode ?? "—"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={copyCode}
              disabled={!trialAccessCode}
            >
              <Copy className="size-4" />
              {copied ? "Copié !" : "Copier"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRegenOpen(true)}
            >
              <RefreshCw className="size-4" />
              Régénérer
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Testeurs
          </p>
          <p className="text-lg font-bold text-text">
            {currentMembersCount}
            <span className="text-sm font-medium text-muted">
              {" "}/ {trialMaxMembers}
            </span>
          </p>
        </div>

        <p className="text-xs text-muted">
          Partagez ce code avec les personnes que vous souhaitez inviter à
          tester l&apos;application. Vous pouvez aussi envoyer des invitations
          par email.
        </p>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setInviteOpen(true)}
        >
          <Mail className="size-4" />
          Envoyer des invitations
        </Button>

        {feedback ? (
          <p className="text-xs font-medium text-purple">{feedback}</p>
        ) : null}
      </Card>

      <Modal
        open={regenOpen}
        onClose={() => setRegenOpen(false)}
        title="Régénérer le code d'accès"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text">
            Toute personne tentant de s&apos;inscrire avec l&apos;ancien code
            sera bloquée. Les adhérent·es existant·es ne sont pas affecté·es.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRegenOpen(false)}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleRegenerate}
              disabled={isPending}
            >
              Confirmer
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Envoyer des invitations"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Saisissez les adresses email des personnes à inviter (séparées par
            des virgules, points-virgules, ou retours à la ligne). Maximum 20
            par envoi.
          </p>
          <FormField label="Adresses email">
            <textarea
              className="min-h-[100px] w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-subtle focus-visible:border-purple focus-visible:ring-2 focus-visible:ring-purple/30"
              placeholder="marie.dupont@email.fr, jean.martin@email.fr"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInviteOpen(false)}
              disabled={sendingInvites}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleSendInvitations}
              disabled={sendingInvites || !canSendInvites}
            >
              {sendingInvites ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Mail className="size-4" aria-hidden />
              )}
              {sendingInvites ? "Envoi…" : "Envoyer"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
