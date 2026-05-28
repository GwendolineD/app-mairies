"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/lib/actions/auth";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/form-field";
import { PageHeading } from "@/components/ui/page-heading";

export function ConnexionForm() {
  const [state, formAction] = useActionState(
    async (_: { error?: string } | undefined, fd: FormData) => signIn(fd),
    undefined as { error?: string } | undefined,
  );

  return (
    <div className="mx-auto w-full max-w-md px-4">
      <PageHeading
        centered
        className="mb-6"
        title="Connexion"
        subtitle="Accédez à votre commune active."
      />
      <Card className="p-6">
        <form action={formAction} className="flex flex-col gap-4">
          <FormField label="E-mail">
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </FormField>
          <FormField label="Mot de passe">
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </FormField>
          {state?.error ? (
            <p className="rounded-xl bg-soft-pink px-3 py-2 text-xs font-medium text-text" role="alert">
              {state.error}
            </p>
          ) : null}
          <Button type="submit" className="w-full py-3">
            Se connecter
          </Button>
        </form>
      </Card>
      <p className="mt-6 text-center text-sm font-medium text-muted">
        Pas encore inscrit·e ?{" "}
        <Link href={ROUTES.inscription.root} className="font-semibold text-purple underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
