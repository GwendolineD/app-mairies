"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ConnexionForm() {
  const [state, formAction] = useActionState(
    async (_: { error?: string } | undefined, fd: FormData) => signIn(fd),
    undefined as { error?: string } | undefined,
  );

  return (
    <div className="mx-auto w-full max-w-md px-4">
      <h1 className="mb-1 text-center text-2xl font-bold text-text">Connexion</h1>
      <p className="mb-6 text-center text-sm text-muted">
        Accédez à votre commune active.
      </p>
      <Card className="p-6">
        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-text">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-text">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
            />
          </div>
          {state?.error ? (
            <p className="rounded-xl bg-soft-pink px-3 py-2 text-xs text-text" role="alert">
              {state.error}
            </p>
          ) : null}
          <Button type="submit" className="w-full rounded-full py-3">
            Se connecter
          </Button>
        </form>
      </Card>
      <p className="mt-6 text-center text-sm text-muted">
        Pas encore inscrit·e ?{" "}
        <Link href="/inscription" className="font-semibold text-purple">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
