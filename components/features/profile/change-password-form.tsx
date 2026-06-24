"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { changePassword } from "@/lib/actions/auth";
import { changePasswordSchema } from "@/lib/validations/schemas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PasswordField } from "@/components/ui/password-field";
import { cn } from "@/lib/utils";

type Props = {
  cardClassName?: string;
};

export function ChangePasswordForm({ cardClassName }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordValid, setNewPasswordValid] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSubmit = useMemo(() => {
    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return parsed.success && newPasswordValid;
  }, [currentPassword, newPassword, confirmPassword, newPasswordValid]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      const result = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if ("error" in result) {
        setFormError(result.error);
        return;
      }
      toast.success("Mot de passe mis à jour !");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsExpanded(false);
    });
  }

  return (
    <Card className={cn("space-y-4 p-5", cardClassName)}>
      <div>
        <h2 className="text-xl font-semibold leading-7 text-text">
          Sécurité du compte
        </h2>
        <p className="mt-1 text-sm font-medium text-muted">
          Modifiez votre mot de passe pour sécuriser votre compte.
        </p>
      </div>

      {!isExpanded ? (
        <Button
          type="button"
          variant="secondary"
          className="w-fit self-end"
          onClick={() => setIsExpanded(true)}
        >
          Changer mon mot de passe
        </Button>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordField
          name="currentPassword"
          label="Mot de passe actuel"
          value={currentPassword}
          onValueChange={setCurrentPassword}
          autoComplete="current-password"
          placeholder="Votre mot de passe actuel"
          showValidation={false}
        />

        <PasswordField
          name="newPassword"
          label="Nouveau mot de passe"
          value={newPassword}
          onValueChange={setNewPassword}
          onValidityChange={setNewPasswordValid}
          autoComplete="new-password"
          placeholder="Nouveau mot de passe"
        />

        <PasswordField
          name="confirmPassword"
          label="Confirmer le nouveau mot de passe"
          value={confirmPassword}
          onValueChange={setConfirmPassword}
          autoComplete="new-password"
          placeholder="Confirmez le nouveau mot de passe"
          showValidation={false}
        />

        {formError ? (
          <p className="text-sm font-medium text-coral" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={!canSubmit || isPending}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Enregistrer le mot de passe
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => {
              setIsExpanded(false);
              setFormError(null);
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
            }}
          >
            Annuler
          </Button>
        </div>
      </form>
      )}
    </Card>
  );
}
