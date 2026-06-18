"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/form-field";
import { updatePlatformSettings } from "@/lib/actions/platform-settings";

type Props = {
  initialSupportEmail: string;
};

export function PlatformSettingsForm({ initialSupportEmail }: Props) {
  const [email, setEmail] = useState(initialSupportEmail);
  const [saved, setSaved] = useState(false);
  const [busy, run] = useTransition();

  function handleSubmit() {
    setSaved(false);
    run(async () => {
      const result = await updatePlatformSettings({ supportEmail: email.trim() });
      if (result.success) setSaved(true);
    });
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-4"
    >
      <FormField label="Email d'assistance (affiché aux utilisateurs suspendus)">
        <Input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setSaved(false);
          }}
          placeholder="contact@vielocale.fr"
          required
        />
      </FormField>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" size="sm" disabled={busy}>
          Enregistrer
        </Button>
        {saved && (
          <span className="text-sm font-medium text-mint">
            ✓ Enregistré
          </span>
        )}
      </div>
    </form>
  );
}
