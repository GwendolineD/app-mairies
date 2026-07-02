"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CloudImage } from "@/components/ui/cloud-image";
import { FormField, Input } from "@/components/ui/form-field";
import { updatePlatformSettings } from "@/lib/actions/platform-settings";
import { isCloudinaryDeliveryUrl } from "@/lib/services/cloudinary";
import { cn } from "@/lib/utils/cn";

type Props = {
  initialSupportEmail: string;
  initialErrorIllustrationUrls: string[];
};

function isValidUrl(value: string): boolean {
  return isCloudinaryDeliveryUrl(value.trim());
}

function normalizeIllustrationUrls(urls: string[]): string[] {
  return urls.map((url) => url.trim()).filter(Boolean);
}

function areIllustrationUrlsEqual(a: string[], b: string[]): boolean {
  const normalizedA = normalizeIllustrationUrls(a);
  const normalizedB = normalizeIllustrationUrls(b);
  if (normalizedA.length !== normalizedB.length) return false;
  return normalizedA.every((url, index) => url === normalizedB[index]);
}

export function PlatformSettingsForm({
  initialSupportEmail,
  initialErrorIllustrationUrls,
}: Props) {
  const [email, setEmail] = useState(initialSupportEmail);
  const [illustrationUrls, setIllustrationUrls] = useState<string[]>(
    initialErrorIllustrationUrls.length > 0 ? initialErrorIllustrationUrls : [""],
  );
  const [baselineEmail, setBaselineEmail] = useState(initialSupportEmail);
  const [baselineUrls, setBaselineUrls] = useState(initialErrorIllustrationUrls);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, run] = useTransition();

  const hasInvalidUrls = illustrationUrls.some(
    (url) => url.trim().length > 0 && !isCloudinaryDeliveryUrl(url.trim()),
  );

  const isDirty = useMemo(
    () =>
      email.trim() !== baselineEmail.trim() ||
      !areIllustrationUrlsEqual(illustrationUrls, baselineUrls),
    [email, illustrationUrls, baselineEmail, baselineUrls],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError(null);

    run(async () => {
      const result = await updatePlatformSettings({
        supportEmail: email.trim(),
        errorIllustrationUrls: illustrationUrls
          .map((url) => url.trim())
          .filter(Boolean),
      });
      if (result.success) {
        const trimmedEmail = email.trim();
        const savedUrls = normalizeIllustrationUrls(illustrationUrls);
        setBaselineEmail(trimmedEmail);
        setBaselineUrls(savedUrls);
        setSaved(true);
        return;
      }
      setError(result.error ?? "Erreur lors de l'enregistrement.");
    });
  }

  function updateUrl(index: number, value: string) {
    setIllustrationUrls((prev) => prev.map((url, i) => (i === index ? value : url)));
    setSaved(false);
  }

  function addUrl() {
    setIllustrationUrls((prev) => [...prev, ""]);
    setSaved(false);
  }

  function removeUrl(index: number) {
    setIllustrationUrls((prev) =>
      prev.length <= 1 ? [""] : prev.filter((_, i) => i !== index),
    );
    setSaved(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField label="Email d'assistance (contact utilisateurs)">
        <Input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setSaved(false);
          }}
          placeholder="contact@tous-voisins.fr"
          required
        />
      </FormField>

      <div className="space-y-3 border-t border-border pt-6">
        <div>
          <h3 className="text-base font-semibold text-text">
            Illustrations — pages d&apos;erreur
          </h3>
          <p className="mt-1 text-sm text-muted">
            URLs Cloudinary affichées aléatoirement sur les pages d&apos;erreur
            (résident·e, mairie, backoffice).
          </p>
        </div>

        <div className="space-y-3">
          {illustrationUrls.map((url, index) => {
            const trimmedUrl = url.trim();
            const showPreview = isValidUrl(url);
            const showUrlError = trimmedUrl.length > 0 && !showPreview;
            return (
              <div
                key={index}
                className="flex flex-col gap-2 rounded-lg border border-border/60 bg-warm/40 p-3 sm:flex-row sm:items-start"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <FormField label={`URL ${index + 1}`}>
                    <Input
                      type="url"
                      value={url}
                      onChange={(e) => updateUrl(index, e.target.value)}
                      placeholder="https://res.cloudinary.com/..."
                      aria-invalid={showUrlError}
                    />
                  </FormField>
                  {showUrlError ? (
                    <p className="text-xs font-medium text-coral">
                      Domaine attendu : res.cloudinary.com
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2 sm:pt-7">
                  <div
                    className={cn(
                      "relative size-16 overflow-hidden rounded-md border border-border bg-surface",
                      !showPreview && "border-dashed bg-warm",
                    )}
                  >
                    {showPreview ? (
                      <CloudImage
                        src={url.trim()}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-contain p-1"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center text-xs text-subtle">
                        Aperçu
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUrl(index)}
                    aria-label={`Supprimer l'URL ${index + 1}`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addUrl}
          disabled={illustrationUrls.length >= 20}
        >
          <Plus className="size-4" aria-hidden />
          Ajouter une URL
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={busy || !isDirty || hasInvalidUrls}
        >
          Enregistrer
        </Button>
        {saved && (
          <span className="text-sm font-medium text-mint">✓ Enregistré</span>
        )}
        {error && (
          <span className="text-sm font-medium text-coral">{error}</span>
        )}
      </div>
    </form>
  );
}
