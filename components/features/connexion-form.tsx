"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { useAuthCredentials } from "@/components/features/auth/auth-credentials-provider";
import { signIn } from "@/lib/actions/auth";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import { IconField, IconInput } from "@/components/ui/icon-field";
import { PasswordField } from "@/components/ui/password-field";

export function ConnexionForm({
  callbackError,
}: {
  callbackError?: boolean;
}) {
  const { email, password, setCredentials } = useAuthCredentials();
  const [state, formAction, isPending] = useActionState(
    async (_: { error?: string } | undefined, fd: FormData) => signIn(fd),
    undefined as { error?: string } | undefined,
  );

  const displayError =
    state?.error ??
    (callbackError
      ? "Lien invalide ou expiré. Demandez un nouveau mot de passe."
      : undefined);

  return (
    <div className="mx-auto flex w-full max-w-[500px] flex-1 flex-col rounded-none bg-transparent px-0 py-0 shadow-none md:min-h-0 md:rounded-3xl md:bg-surface md:px-12 md:py-16 md:shadow-elevated">
      <div className="flex shrink-0 flex-col items-center text-center">
        <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-purple/15 md:size-12">
          <Lock
            className="size-5 text-purple md:size-6"
            strokeWidth={2.25}
            aria-hidden
          />
        </div>
        <h1 className="text-xl font-bold text-text md:text-[1.35rem]">
          Se connecter
        </h1>
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

          <PasswordField
            autoComplete="current-password"
            placeholder="Votre mot de passe"
            showValidation={false}
            value={password}
            onValueChange={(value) => setCredentials({ password: value })}
          />

          <Link
            href={ROUTES.connexionForgotPassword}
            className="self-end text-xs font-semibold text-purple underline"
          >
            Mot de passe oublié ?
          </Link>

          {displayError ? (
            <p
              className="rounded-md bg-soft-pink px-3 py-2 text-xs font-medium text-coral"
              role="alert"
            >
              {displayError}
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
            Se connecter
          </Button>

          <p className="text-center text-xs font-medium text-muted">
            Pas encore de compte ?{" "}
            <Link
              href={ROUTES.inscription.root}
              className="cursor-pointer font-semibold text-purple underline"
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
