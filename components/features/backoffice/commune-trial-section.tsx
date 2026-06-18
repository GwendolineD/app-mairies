"use client";

import { useCallback, useState, useTransition } from "react";
import { Copy, Mail, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import {
  regenerateTrialCode,
  sendTrialInvitationsAsAdmin,
  updateTrialMaxMembers,
} from "@/lib/actions/trial-invitation";
import type { AccessStatus } from "@/lib/types";

type Props = {
  communeId: string;
  accessStatus: AccessStatus;
  trialAccessCode: string | null;
  trialMaxMembers: number;
  currentMembersCount: number;
};

export function CommuneTrialSection({
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
  const [maxMembers, setMaxMembers] = useState(String(trialMaxMembers));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isTrial = accessStatus === "trial";

  const copyCode = useCallback(async () => {
    if (!trialAccessCode) return;
    await navigator.clipboard.writeText(trialAccessCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [trialAccessCode]);

  const handleRegenerate = useCallback(() => {
    startTransition(async () => {
      const res = await regenerateTrialCode(communeId);
      if (!res.success) {
        setFeedback(res.error);
      } else {
        setFeedback("Nouveau code généré.");
      }
      setRegenOpen(false);
    });
  }, [communeId]);

  const handleSendInvitations = useCallback(() => {
    startTransition(async () => {
      const res = await sendTrialInvitationsAsAdmin(communeId, emails);
      if (!res.success) {
        setFeedback(res.error);
      } else {
        setFeedback(`${res.sentCount ?? 0} invitation(s) envoyée(s).`);
        setEmails("");
        setInviteOpen(false);
      }
    });
  }, [communeId, emails]);

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
    <>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold leading-7 text-text">
          Mode essai
        </h2>

        <Card className="space-y-5 p-6">
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
                title="Copier le code"
              >
                <Copy className="size-4" />
                {copied ? "Copié !" : "Copier"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRegenOpen(true)}
                title="Générer un nouveau code"
              >
                <RefreshCw className="size-4" />
                Régénérer
              </Button>
            </div>
          </div>

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

          <div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setInviteOpen(true)}
            >
              <Mail className="size-4" />
              Envoyer des invitations
            </Button>
          </div>

          {feedback ? (
            <p className="text-xs font-medium text-purple">{feedback}</p>
          ) : null}
        </Card>
      </section>

      <Modal
        open={regenOpen}
        onClose={() => setRegenOpen(false)}
        title="Régénérer le code d'accès"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text">
            Toute personne tentant de s&apos;inscrire avec l&apos;ancien code sera
            bloquée à partir de maintenant. Les adhérent·es existant·es ne sont pas
            affecté·es.
          </p>
          <div className="flex gap-2">
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
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInviteOpen(false)}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleSendInvitations}
              disabled={isPending || !emails.trim()}
            >
              <Mail className="size-4" />
              Envoyer
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
