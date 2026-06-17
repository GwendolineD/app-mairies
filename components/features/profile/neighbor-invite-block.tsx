"use client";

import { useActionState } from "react";
import { Mail, Send } from "lucide-react";
import { toast } from "sonner";
import {
  createNeighborInvite,
  type NeighborInviteState,
} from "@/lib/actions/messages";
import type { NeighborInviteTemplateView } from "@/lib/utils/email-template";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/form-field";
import { useEffect, useRef } from "react";

type Props = {
  template: NeighborInviteTemplateView;
  senderName: string;
  communeName: string;
  inviteCount: number;
};

export function NeighborInviteBlock(props: Props) {
  const { inviteCount } = props;
  const formRef = useRef<HTMLFormElement>(null);
  const prevStateRef = useRef<NeighborInviteState | undefined>(undefined);

  const [state, action, pending] = useActionState(
    async (_: NeighborInviteState | undefined, formData: FormData) =>
      createNeighborInvite(_, formData),
    undefined,
  );

  useEffect(() => {
    if (state === prevStateRef.current) return;
    prevStateRef.current = state;

    if (state?.success) {
      toast.success(`Invitation envoyée à ${state.email} !`);
      formRef.current?.reset();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Card className="overflow-hidden p-0">
      <div className="gradient-hero p-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
              Invitez vos voisins !
            </p>
            <h2 className="mt-2 text-lg font-semibold leading-6">
              Plus nous sommes nombreux, plus notre commune est vivante et solidaire.
            </h2>
          </div>
          <div className="rounded-full bg-surface/20 p-3">
            <Mail className="size-6" aria-hidden />
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <form ref={formRef} action={action} className="space-y-3">
          <Input
            type="email"
            name="email"
            required
            placeholder="voisin@exemple.fr"
            aria-label="Adresse e-mail du voisin"
          />
          <Button type="submit" className="w-full" disabled={pending}>
            <Send className="size-4" aria-hidden />
            {pending ? "Envoi en cours..." : "Envoyer l'invitation"}
          </Button>
        </form>

        <p className="text-xs font-medium leading-5 text-subtle">
          {inviteCount} invitation{inviteCount !== 1 ? "s" : ""} envoyée
          {inviteCount !== 1 ? "s" : ""} depuis ce profil.
        </p>
      </div>
    </Card>
  );
}
