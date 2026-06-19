"use client";

import { useActionState, useEffect, useRef } from "react";
import Image from "next/image";
import { Send } from "lucide-react";
import { toast } from "sonner";
import {
  createNeighborInvite,
  type NeighborInviteState,
} from "@/lib/actions/messages";
import { APP_NAME } from "@/lib/constants/app";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/form-field";
import { ILLUSTRATIONS } from "@/lib/constants/illustrations";

type Props = {
  senderName: string;
  communeName: string;
  inviteCount: number;
};

export function NeighborInviteBlock(props: Props) {
  const { inviteCount } = props;
  const formRef = useRef<HTMLFormElement>(null);
  const prevStateRef = useRef<NeighborInviteState | undefined>(undefined);
  const illustrationUrl = ILLUSTRATIONS.resident.profil.neighborInvite;

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
    <Card className="overflow-hidden rounded-xl p-0">
      <div className="space-y-4 p-5">
        <div className="w-[80%] space-y-2">
          <p className="mb-1 text-xl font-bold leading-7 text-text">Invitez vos voisins !</p>

          <p className="text-xs font-medium leading-4 text-text">
            Plus nous sommes nombreux, plus notre commune est vivante et solidaire.
          </p>
          <p className="text-xs font-medium leading-4 text-text">
            Invitez vos voisins à rejoindre {APP_NAME} !
          </p>
        </div>

        {illustrationUrl ? (
          <div className="w-full">
            <Image
              src={illustrationUrl}
              alt=""
              width={0}
              height={0}
              sizes="(min-width: 1024px) 320px, 100vw"
              className="h-auto w-full"
              style={{ width: "100%", height: "auto" }}
              unoptimized
            />
          </div>
        ) : null}

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
          Bravo, {inviteCount} invitation{inviteCount !== 1 ? "s" : ""} envoyée
          {inviteCount !== 1 ? "s" : ""} depuis ce profil.
        </p>
      </div>
    </Card>
  );
}
