"use client";

import { Check, Eye, EyeOff, Lock, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { formFieldClassName } from "@/components/ui/form-field";

export const PASSWORD_RULE = /(?=.*[A-Za-z])(?=.*\d).{8,}/;

type Props = {
  name?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  onValidityChange?: (valid: boolean) => void;
  showValidation?: boolean;
};

export function PasswordField({
  name = "password",
  required = true,
  autoComplete = "new-password",
  placeholder = "Minimum 8 caractères",
  value,
  onValueChange,
  onValidityChange,
  showValidation = true,
}: Props) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState("");
  const inputValue = isControlled ? value : uncontrolledValue;
  const isValid = PASSWORD_RULE.test(inputValue);

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  function handleChange(next: string) {
    if (!isControlled) {
      setUncontrolledValue(next);
    }
    onValueChange?.(next);
  }

  return (
    <div className={showValidation ? "space-y-2" : undefined}>
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
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          className={cn(formFieldClassName, "pl-10 pr-10 placeholder:text-subtle")}
        />
        <button
          type="button"
          className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-subtle hover:text-text"
          onClick={() => setVisible((v) => !v)}
          aria-label={
            visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
          }
        >
          {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
        </button>
      </div>
      {showValidation ? (
        <p
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium",
            isValid
              ? "text-[color-mix(in_srgb,var(--mint)_82%,var(--text))]"
              : "text-muted",
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
      ) : null}
    </div>
  );
}
