"use client";

import { useActionState, useMemo } from "react";
import { Mail, Send } from "lucide-react";
import {
  createNeighborInvite,
  type NeighborInviteState,
} from "@/lib/actions/messages";
import {
  renderNeighborInviteTemplate,
  type NeighborInviteTemplateView,
} from "@/lib/utils/email-template";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/form-field";

type Props = {
  template: NeighborInviteTemplateView;
  senderName: string;
  communeName: string;
  inviteCount: number;
};

export function NeighborInviteCard({
  template,
  senderName,
  communeName,
  inviteCount,
}: Props) {
  const [state, action, pending] = useActionState(
    async (_: NeighborInviteState | undefined, formData: FormData) =>
      createNeighborInvite(_, formData),
    undefined,
  );
  const preview = useMemo(
    () =>
      renderNeighborInviteTemplate(template, {
        senderName,
        communeName,
        inviteLink: "https://vie-locale.fr/invitation",
      }),
    [communeName, senderName, template],
  );
  const previewLines = preview.body.split("\n").filter(Boolean).slice(0, 2);

  return (
    <Card className="overflow-hidden p-0">
      <div className="gradient-hero p-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
              Inviter un voisin
            </p>
            <h2 className="mt-2 text-xl font-semibold leading-7">
              Plus on est nombreux, plus le village s&apos;anime.
            </h2>
          </div>
          <div className="rounded-full bg-surface/20 p-3">
            <Mail className="size-6" aria-hidden />
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="rounded-2xl border border-border bg-soft-pink p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple">
            Aperçu du mail
          </p>
          <p className="mt-2 text-base font-semibold leading-6 text-text">
            {preview.subject}
          </p>
          <p className="mt-1 text-sm font-medium leading-5 text-muted">
            {preview.preheader}
          </p>
          <div className="mt-3 space-y-2 rounded-xl bg-surface p-3 text-sm font-medium leading-5 text-text">
            {previewLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <span className="inline-flex rounded-full bg-purple px-3 py-1 text-xs font-semibold text-white">
              {preview.ctaLabel}
            </span>
          </div>
        </div>

        <form action={action} className="space-y-3">
          <Input
            type="email"
            name="email"
            required
            placeholder="voisin@exemple.fr"
            aria-label="Adresse e-mail du voisin"
          />
          <Button type="submit" className="w-full" disabled={pending}>
            <Send className="size-4" aria-hidden />
            {pending ? "Préparation..." : "Préparer le partage par mail"}
          </Button>
        </form>

        {state?.error ? (
          <p className="text-sm font-semibold text-coral">{state.error}</p>
        ) : null}

        {state?.success && state.mailtoHref ? (
          <div className="space-y-3 rounded-2xl border border-mint/30 bg-mint/10 p-4">
            <p className="text-sm font-semibold text-text">
              Invitation prête pour {state.email}.
            </p>
            <a
              href={state.mailtoHref}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm bg-surface px-5 py-2.5 text-sm font-semibold text-purple shadow-card transition hover:bg-warm"
            >
              Ouvrir l&apos;e-mail à envoyer
            </a>
          </div>
        ) : null}

        <p className="text-xs font-medium leading-5 text-subtle">
          {inviteCount} invitation{inviteCount > 1 ? "s" : ""} déjà préparée
          {inviteCount > 1 ? "s" : ""} depuis ce profil.
        </p>
      </div>
    </Card>
  );
}
