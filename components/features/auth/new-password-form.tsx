"use client";

import { startTransition, useActionState, useState } from "react";
import { ArrowRight, Lock } from "lucide-react";
import { updatePassword } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";

export function NewPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, formAction, isPending] = useActionState(
    async (_: { error?: string } | undefined, fd: FormData) =>
      updatePassword(fd),
    undefined as { error?: string } | undefined,
  );

  return (
    <div className="flex flex-1 flex-col rounded-3xl bg-surface px-8 py-14 shadow-elevated md:min-h-0 md:px-12 md:py-16">
      <div className="flex shrink-0 flex-col items-center text-center">
        <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-purple/15 md:size-12">
          <Lock
            className="size-5 text-purple md:size-6"
            strokeWidth={2.25}
            aria-hidden
          />
        </div>
        <h1 className="text-xl font-bold text-text md:text-[1.35rem]">
          Nouveau mot de passe
        </h1>
        <p className="mt-2 max-w-xs text-sm font-medium text-muted">
          Choisissez un mot de passe sécurisé pour retrouver l&apos;accès à votre
          compte.
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
          <PasswordField
            name="password"
            autoComplete="new-password"
            placeholder="Nouveau mot de passe"
            showValidation
            value={password}
            onValueChange={setPassword}
          />

          <PasswordField
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Confirmez le mot de passe"
            showValidation={false}
            value={confirmPassword}
            onValueChange={setConfirmPassword}
          />

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
            Enregistrer mon nouveau mot de passe
          </Button>
        </div>
      </form>
    </div>
  );
}
