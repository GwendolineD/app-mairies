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
import { cn } from "@/lib/utils/cn";

type Props = {
  senderName: string;
  communeName: string;
  inviteCount: number;
  /** Full-width placement: on md+, illustration and form sit side by side below the copy. */
  desktopSplit?: boolean;
};

export function NeighborInviteBlock(props: Props) {
  const { inviteCount, desktopSplit = false } = props;
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

  const illustration = illustrationUrl ? (
    <div className="w-full">
      <Image
        src={illustrationUrl}
        alt=""
        width={0}
        height={0}
        sizes={
          desktopSplit
            ? "(min-width: 768px) 50vw, 100vw"
            : "(min-width: 1024px) 320px, 100vw"
        }
        className="h-auto w-full"
        style={{ width: "100%", height: "auto" }}
        unoptimized
      />
    </div>
  ) : null;

  const form = (
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
  );

  const descriptiveCopy = (
    <>
      <p className="text-sm font-medium leading-5 text-text">
        Plus nous sommes nombreux, plus notre commune est vivante et
        solidaire.
      </p>
      <p className="text-sm font-medium leading-5 text-text">
        Invitez vos voisins à rejoindre {APP_NAME} !
      </p>
    </>
  );

  const content = (
      <div
        className={cn("space-y-4 p-5", desktopSplit && "p-0 md:p-5")}
      >
        <div className="w-[80%] space-y-2">
          <p className="mb-1 text-xl font-bold leading-7 text-text">
            Invitez vos voisins !
          </p>

          <div className={desktopSplit ? "space-y-2 md:hidden" : "space-y-2"}>
            {descriptiveCopy}
          </div>
        </div>

        {desktopSplit ? (
          <div className="space-y-4 md:grid md:grid-cols-2 md:items-center md:gap-6 md:space-y-0">
            {illustration}
            <div className="space-y-4">
              <div className="hidden space-y-2 md:block">{descriptiveCopy}</div>
              {form}
            </div>
          </div>
        ) : (
          <>
            {illustration}
            {form}
          </>
        )}

        {inviteCount > 0 ? (
          <p className="text-xs leading-5 max-md:font-bold max-md:text-[color-mix(in_srgb,var(--mint)_55%,var(--text))] md:font-medium md:text-subtle">
            Bravo, {inviteCount} invitation{inviteCount !== 1 ? "s" : ""}{" "}
            envoyée
            {inviteCount !== 1 ? "s" : ""} depuis ce profil.
          </p>
        ) : null}
      </div>
  );

  if (desktopSplit) {
    return (
      <div className="overflow-hidden p-0 md:rounded-xl md:border md:border-border/60 md:bg-surface md:shadow-card">
        {content}
      </div>
    );
  }

  return <Card className="overflow-hidden rounded-xl p-0">{content}</Card>;
}
