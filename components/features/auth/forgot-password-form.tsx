"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { useAuthCredentials } from "@/components/features/auth/auth-credentials-provider";
import { requestPasswordReset } from "@/lib/actions/auth";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import { IconField, IconInput } from "@/components/ui/icon-field";

type FormState =
  | { error?: string; success?: boolean }
  | undefined;

export function ForgotPasswordForm() {
  const { email, setCredentials } = useAuthCredentials();
  const [state, formAction, isPending] = useActionState(
    async (_: FormState, fd: FormData) => requestPasswordReset(fd),
    undefined as FormState,
  );

  if (state?.success) {
    return (
      <div className="flex flex-1 flex-col rounded-3xl bg-surface px-8 py-14 shadow-elevated md:min-h-0 md:px-12 md:py-16">
        <div className="flex flex-1 flex-col justify-center gap-4 text-center">
          <h1 className="text-xl font-bold text-text md:text-[1.35rem]">
            E-mail envoyé
          </h1>
          <p className="text-sm font-medium text-muted">
            Si un compte existe avec cette adresse, vous recevrez un lien pour
            choisir un nouveau mot de passe. Pensez à vérifier vos spams.
          </p>
        </div>
        <div className="pt-8">
          <Link
            href={ROUTES.connexion}
            className="block text-center text-xs font-semibold text-purple underline"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col rounded-3xl bg-surface px-8 py-14 shadow-elevated md:min-h-0 md:px-12 md:py-16">
      <div className="flex shrink-0 flex-col items-center text-center">
        <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-purple/15 md:size-12">
          <Mail
            className="size-5 text-purple md:size-6"
            strokeWidth={2.25}
            aria-hidden
          />
        </div>
        <h1 className="text-xl font-bold text-text md:text-[1.35rem]">
          Mot de passe oublié
        </h1>
        <p className="mt-2 max-w-xs text-sm font-medium text-muted">
          Pas de panique, on vous envoie un lien pour choisir un nouveau mot de
          passe.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          startTransition(() => {
            formAction(formData);
          });
        }}
        className="flex flex-1 flex-col pt-8 md:pt-10"
      >
        <div className="flex flex-1 flex-col justify-center gap-4 md:gap-5">
          <IconField label="Adresse email" icon={Mail}>
            <IconInput
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="votre.email@exemple.com"
              value={email}
              onChange={(e) => setCredentials({ email: e.target.value })}
            />
          </IconField>

          {state?.error ? (
            <p
              className="rounded-md bg-soft-pink px-3 py-2 text-xs font-medium text-coral"
              role="alert"
            >
              {state.error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-6 pt-4">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full py-3 text-[15px] font-bold md:py-2.5"
          >
            <ArrowRight className="size-[18px]" strokeWidth={2.5} aria-hidden />
            Envoyer le lien
          </Button>

          <p className="text-center text-xs font-medium text-muted">
            <Link
              href={ROUTES.connexion}
              className="cursor-pointer font-semibold text-purple underline"
            >
              Retour à la connexion
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
