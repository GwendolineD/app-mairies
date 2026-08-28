"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect } from "react";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuthCredentials } from "@/components/features/auth/auth-credentials-provider";
import { resendVerificationEmail, signIn } from "@/lib/actions/auth";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import { IconField, IconInput } from "@/components/ui/icon-field";
import { PasswordField } from "@/components/ui/password-field";

type SignInState =
  | { error?: string; emailNotConfirmed?: boolean }
  | undefined;

type ResendState =
  | { error?: string; success?: boolean }
  | undefined;

export function ConnexionForm({
  callbackError,
  emailConfirmed,
  accountDeleted,
  redirectTo,
  prefillEmail,
}: {
  callbackError?: "recovery" | "generic";
  emailConfirmed?: boolean;
  accountDeleted?: boolean;
  redirectTo?: string;
  prefillEmail?: string;
}) {
  const { email, password, setCredentials } = useAuthCredentials();
  const [state, formAction, isPending] = useActionState(
    async (_: SignInState, fd: FormData) => signIn(fd) as Promise<SignInState>,
    undefined as SignInState,
  );
  const [resendState, resendAction, resendPending] = useActionState(
    async (_: ResendState, fd: FormData) => resendVerificationEmail(fd),
    undefined as ResendState,
  );

  const displayError =
    state?.error ??
    (callbackError === "recovery"
      ? "Lien invalide ou expiré. Demandez un nouveau mot de passe."
      : callbackError === "generic"
        ? "Lien de connexion invalide ou expiré. Réessayez."
        : undefined);

  const showResendVerification = Boolean(state?.emailNotConfirmed);

  useEffect(() => {
    if (!accountDeleted) return;
    toast.success("Votre compte a bien été supprimé. À bientôt !");
  }, [accountDeleted]);

  useEffect(() => {
    if (!prefillEmail?.trim()) return;
    setCredentials({ email: prefillEmail.trim().toLowerCase() });
  }, [prefillEmail, setCredentials]);

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

      {emailConfirmed && (
        <div
          className="mt-4 rounded-sm border border-mint/30 bg-mint/10 px-4 py-3 text-center text-sm font-medium text-text"
          role="status"
        >
          Email confirmé avec succès ! Vous pouvez maintenant vous connecter.
        </div>
      )}

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
        {redirectTo ? (
          <input type="hidden" name="redirectTo" value={redirectTo} />
        ) : null}

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
            <div className="space-y-3">
              <p
                className="rounded-md bg-soft-pink px-3 py-2 text-xs font-medium text-coral"
                role="alert"
              >
                {displayError}
              </p>
              {showResendVerification ? (
                <div className="space-y-2">
                  {resendState?.success ? (
                    <p
                      className="rounded-md border border-mint/30 bg-mint/10 px-3 py-2 text-xs font-medium text-text"
                      role="status"
                    >
                      Si un compte non confirmé existe avec cette adresse, un
                      nouvel e-mail de vérification vient d&apos;être envoyé.
                      Pensez à vérifier vos spams.
                    </p>
                  ) : null}
                  {resendState?.error ? (
                    <p
                      className="rounded-md bg-soft-pink px-3 py-2 text-xs font-medium text-coral"
                      role="alert"
                    >
                      {resendState.error}
                    </p>
                  ) : null}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={resendPending || !email.trim()}
                    className="w-full"
                    onClick={() => {
                      const formData = new FormData();
                      formData.set("email", email);
                      startTransition(() => {
                        resendAction(formData);
                      });
                    }}
                  >
                    {resendPending
                      ? "Envoi en cours…"
                      : "Renvoyer l'e-mail de vérification"}
                  </Button>
                </div>
              ) : null}
            </div>
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
