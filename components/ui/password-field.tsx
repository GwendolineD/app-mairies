"use client";

import { Check, Eye, EyeOff, Lock, X } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { formFieldClassName } from "@/components/ui/form-field";

export const PASSWORD_RULE = /(?=.*[A-Za-z])(?=.*\d).{8,}/;

type Props = {
  name?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  onValidityChange?: (valid: boolean) => void;
};

export function PasswordField({
  name = "password",
  required = true,
  autoComplete = "new-password",
  placeholder = "Minimum 8 caractères",
  onValidityChange,
}: Props) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [isValid, setIsValid] = useState(false);

  function handleChange(next: string) {
    const valid = PASSWORD_RULE.test(next);
    setIsValid(valid);
    onValidityChange?.(valid);
  }

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-text">
        Mot de passe
      </label>
      <div className="relative">
        <Lock
          className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-subtle"
          aria-hidden
        />
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          defaultValue=""
          onChange={(e) => handleChange(e.target.value)}
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
          {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
        </button>
      </div>
      <p
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium",
          isValid ? "text-[color-mix(in_srgb,var(--mint)_82%,var(--text))]" : "text-muted",
        )}
      >
        {isValid ? (
          <Check
            className="size-3.5 shrink-0 text-[color-mix(in_srgb,var(--mint)_82%,var(--text))]"
            aria-hidden
          />
        ) : (
          <X className="size-3.5 shrink-0 text-subtle" aria-hidden />
        )}
        Utilisez 8 caractères minimum avec lettres et chiffres
      </p>
    </div>
  );
}
