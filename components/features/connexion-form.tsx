"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { Eye, EyeOff, Lock, LogIn, Mail } from "lucide-react";
import { signIn } from "@/lib/actions/auth";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import { IconField, IconInput } from "@/components/ui/icon-field";
import { cn } from "@/lib/utils/cn";
import { formFieldClassName } from "@/components/ui/form-field";

export function ConnexionForm() {
  const [state, formAction] = useActionState(
    async (_: { error?: string } | undefined, fd: FormData) => signIn(fd),
    undefined as { error?: string } | undefined,
  );

  return (
    <>
      <div className="rounded-3xl bg-surface px-6 py-7 shadow-elevated md:px-8 md:py-5">
        <div className="mb-6 flex flex-col items-center text-center md:mb-4">
          <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-soft-pink md:size-12">
            <LogIn
              className="size-5 text-purple md:size-6"
              strokeWidth={2}
              aria-hidden
            />
          </div>
          <h1 className="text-xl font-bold text-text md:text-[1.35rem]">
            Se connecter
          </h1>
          <p className="mt-1 text-sm font-medium text-muted">
            Accédez à votre commune active
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-4 md:gap-3">
          <IconField label="Adresse email" icon={Mail}>
            <IconInput
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="votre.email@exemple.com"
            />
          </IconField>

          <ConnexionPasswordField />

          {state?.error ? (
            <p
              className="rounded-md bg-soft-pink px-3 py-2 text-xs font-medium text-coral"
              role="alert"
            >
              {state.error}
            </p>
          ) : null}

          <Button type="submit" className="mt-1 w-full py-3 text-[15px] font-bold md:py-2.5">
            <LogIn className="size-[18px]" strokeWidth={2.5} aria-hidden />
            Se connecter
          </Button>
        </form>
      </div>

      <p className="mt-4 text-center text-sm font-medium text-muted md:hidden">
        Pas encore inscrit·e ?{" "}
        <Link
          href={ROUTES.inscription.root}
          className="font-semibold text-purple underline"
        >
          Créer un compte
        </Link>
      </p>
    </>
  );
}

function ConnexionPasswordField() {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-text">
        Mot de passe
      </label>
      <div className="relative">
        <Lock
          className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-subtle"
          aria-hidden
        />
        <input
          id={id}
          name="password"
          type={visible ? "text" : "password"}
          required
          autoComplete="current-password"
          placeholder="Votre mot de passe"
          className={cn(formFieldClassName, "pl-10 pr-10 placeholder:text-subtle")}
        />
        <button
          type="button"
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-subtle hover:text-text"
          onClick={() => setVisible((v) => !v)}
          aria-label={
            visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
          }
        >
          {visible ? (
            <EyeOff className="size-[18px]" />
          ) : (
            <Eye className="size-[18px]" />
          )}
        </button>
      </div>
    </div>
  );
}
