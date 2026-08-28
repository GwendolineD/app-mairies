"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  createBatchInvitations,
  createBatchInvitationsAsAdmin,
} from "@/lib/actions/staff-invitation";
import { ROLE_LABELS, MEMBERSHIP_ROLE_OPTIONS } from "@/lib/constants/roles";
import type { MembershipRole } from "@/lib/types";
import { hasAtLeastOneValidEmail } from "@/lib/utils/parse-email-list";

type Props = {
  communeId: string;
  open: boolean;
  onClose: () => void;
  variant: "mairie" | "admin";
  onSuccess?: () => void;
};

export function StaffInviteModal({
  communeId,
  open,
  onClose,
  variant,
  onSuccess,
}: Props) {
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState<MembershipRole>("member");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const canSend = hasAtLeastOneValidEmail(emails);

  const handleSend = async () => {
    setSending(true);
    setFeedback(null);
    try {
      const action =
        variant === "admin"
          ? createBatchInvitationsAsAdmin
          : createBatchInvitations;

      const res = await action(communeId, emails, role);
      if (!res.success) {
        setFeedback(
          res.failedEmails.length > 0
            ? res.failedEmails.join("\n")
            : "Aucune invitation n'a pu être envoyée.",
        );
      } else {
        const msg =
          res.sentCount === 1
            ? "1 invitation envoyée !"
            : `${res.sentCount} invitations envoyées !`;
        const partialMsg =
          res.failedEmails.length > 0
            ? `\n${res.failedEmails.length} échec(s) :\n${res.failedEmails.join("\n")}`
            : "";
        setFeedback(msg + partialMsg);
        setEmails("");
        setRole("member");
        onSuccess?.();
      }
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setFeedback(null);
    setEmails("");
    setRole("member");
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Inviter des habitants" size="md">
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Saisissez une ou plusieurs adresses email (séparées par des virgules,
          points-virgules ou retours à la ligne). Maximum 20 par envoi.
          Chaque personne recevra un lien personnel d&apos;inscription.
        </p>

        <FormField label="Adresses email">
          <textarea
            className="min-h-25 w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-subtle focus-visible:border-purple focus-visible:ring-2 focus-visible:ring-purple/30"
            placeholder="marie.dupont@email.fr, jean.martin@email.fr"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
          />
        </FormField>

        <FormField label="Rôle attribué">
          <Select
            value={role}
            onValueChange={(val) => setRole(val as MembershipRole)}
          >
            <SelectTrigger className="w-full">
              <span className="truncate font-medium text-text">
                {ROLE_LABELS[role]}
              </span>
            </SelectTrigger>
            <SelectContent>
              {MEMBERSHIP_ROLE_OPTIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {feedback ? (
          <p className="whitespace-pre-wrap text-xs font-medium text-purple">
            {feedback}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={sending}>
            Annuler
          </Button>
          <Button size="sm" onClick={handleSend} disabled={sending || !canSend}>
            {sending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Mail className="size-4" aria-hidden />
            )}
            {sending ? "Envoi…" : "Envoyer"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
