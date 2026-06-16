"use client";

import { startTransition, useActionState, useCallback, useState } from "react";
import Link from "next/link";
import { Loader2, UserPlus, Users } from "lucide-react";
import { BanAutocomplete } from "@/components/features/ban-autocomplete";
import { CommuneSelectPopover } from "@/components/features/commune-select-popover";
import { useAuthCredentials } from "@/components/features/auth/auth-credentials-provider";
import { CommuneUnavailableModal } from "@/components/features/auth/commune-unavailable-modal";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/form-field";
import { PasswordField, PASSWORD_RULE } from "@/components/ui/password-field";
import type { BanFeature } from "@/lib/ban/client";
import { searchAddresses } from "@/lib/ban/client";
import {
  formatMunicipalityDisplay,
  formatStreetDisplay,
} from "@/lib/ban/display";
import { signUp } from "@/lib/actions/auth";
import { PRIVACY_URL, TERMS_URL } from "@/lib/constants/app";
import { ROUTES } from "@/lib/constants/routes";
import type { Commune } from "@/lib/types";

type LookupResponse = { commune: Commune | null; error?: string };

type SignupErrorField = Partial<Record<string, string[] | undefined>>;
type SignUpState = { error: SignupErrorField } | undefined;

type AddressDraft = {
  city: string;
  postcode: string;
  street: string;
  lat: number;
  lng: number;
};

export function InscriptionSignupForm() {
  const { email, password, setCredentials } = useAuthCredentials();
  const [communeFeature, setCommuneFeature] = useState<BanFeature | null>(null);
  const [communeActive, setCommuneActive] = useState(false);
  const [communeLoading, setCommuneLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [lookupName, setLookupName] = useState<string | undefined>();
  const [lieuDit, setLieuDit] = useState("");
  const [addr, setAddr] = useState<AddressDraft>({
    city: "",
    postcode: "",
    street: "",
    lat: 0,
    lng: 0,
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [passwordValid, setPasswordValid] = useState(() =>
    PASSWORD_RULE.test(password),
  );

  const [signupState, signupAction, signupPending] = useActionState(
    async (_prev: SignUpState | undefined, formData: FormData) =>
      signUp(formData) as Promise<SignUpState>,
    undefined,
  );

  const onPickCommune = useCallback(async (feature: BanFeature) => {
    setCommuneFeature(feature);
    setCommuneActive(false);
    setCommuneLoading(true);

    try {
      const params = new URLSearchParams({ inseeCode: feature.citycode });
      const res = await fetch(`/api/communes/lookup?${params}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as LookupResponse;
      const row = json.commune;

      if (row?.access_status === "active") {
        setCommuneActive(true);
        setLookupName(row.name);
        setModalOpen(false);
        setAddr({
          city: row.name ?? feature.city ?? "",
          postcode: feature.postcode ?? row.postcode ?? "",
          street: "",
          lat: row.centroid_lat ?? feature.lat,
          lng: row.centroid_lng ?? feature.lng,
        });
      } else {
        setLookupName(row?.name ?? feature.city);
        setModalOpen(true);
        setAddr({ city: "", postcode: "", street: "", lat: 0, lng: 0 });
      }
    } finally {
      setCommuneLoading(false);
    }
  }, []);

  const onPickStreet = useCallback((feature: BanFeature) => {
    setAddr((prev) => ({
      ...prev,
      street: formatStreetDisplay(feature.label),
      postcode: feature.postcode || prev.postcode,
      lat: feature.lat,
      lng: feature.lng,
    }));
  }, []);

  const fetchStreetSuggestions = useCallback(
    (query: string) => {
      if (!communeFeature?.citycode) return Promise.resolve([]);
      return searchAddresses(query, communeFeature.citycode);
    },
    [communeFeature?.citycode],
  );

  const canSubmit =
    communeActive &&
    communeFeature &&
    addr.street.trim().length > 0 &&
    addr.postcode.trim().length >= 4 &&
    acceptedTerms &&
    passwordValid &&
    !signupPending;

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-3xl bg-surface px-8 py-7 shadow-elevated md:px-12 md:py-8">
        <div className="flex shrink-0 flex-col items-center text-center">
          <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-purple/15 md:size-12">
            <Users
              className="size-5 text-purple md:size-6"
              strokeWidth={2.25}
              aria-hidden
            />
          </div>
          <h2 className="text-xl font-bold text-text md:text-[1.35rem]">
            Créer votre compte
          </h2>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            startTransition(() => {
              signupAction(formData);
            });
          }}
          className="flex flex-1 flex-col justify-between gap-6 pt-8 md:gap-8 md:pt-10"
        >
          <div className="flex flex-col gap-4 md:gap-3">
            {communeFeature ? (
              <input
                type="hidden"
                name="inseeCode"
                value={communeFeature.citycode}
              />
            ) : null}
            <input type="hidden" name="addressCity" value={addr.city} />
            <input
              type="hidden"
              name="addressCitycode"
              value={communeFeature?.citycode ?? ""}
            />
            <input type="hidden" name="addressStreet" value={addr.street} />
            <input type="hidden" name="addressLat" value={String(addr.lat)} />
            <input type="hidden" name="addressLng" value={String(addr.lng)} />
            <input
              type="hidden"
              name="acceptedTerms"
              value={acceptedTerms ? "true" : ""}
            />

            <CommuneSelectPopover
              label="Ma commune"
              placeholder="Choisir une commune"
              onSelect={(f) => void onPickCommune(f)}
              value={
                communeFeature
                  ? formatMunicipalityDisplay(communeFeature)
                  : undefined
              }
              disabled={communeLoading}
            />

            {communeLoading ? (
              <p className="-mt-2 text-xs font-medium text-muted">
                Vérification de votre commune...
              </p>
            ) : null}

            {!communeActive && communeFeature && !communeLoading ? (
              <p className="text-xs font-medium text-coral">
                Cette commune n&apos;est pas encore disponible pour
                l&apos;inscription.
              </p>
            ) : null}

            <BanAutocomplete
              label="Rue"
              placeholder="Numéro, rue..."
              fetchSuggestions={fetchStreetSuggestions}
              onSelect={onPickStreet}
              value={addr.street || undefined}
              formatSuggestion={(f) => formatStreetDisplay(f.label)}
              disabled={!communeActive || !communeFeature}
            />

            <div className="grid grid-cols-4 gap-3">
              <FormField label="Code postal" className="col-span-1">
                <Input
                  name="addressPostcode"
                  required
                  autoComplete="postal-code"
                  inputMode="numeric"
                  placeholder="27000"
                  value={addr.postcode}
                  onChange={(e) =>
                    setAddr((prev) => ({ ...prev, postcode: e.target.value }))
                  }
                  disabled={!communeActive}
                />
              </FormField>

              <FormField label="Lieu-dit (optionnel)" className="col-span-3">
                <Input
                  name="addressLieuDit"
                  autoComplete="off"
                  placeholder="Hameau, quartier..."
                  value={lieuDit}
                  onChange={(e) => setLieuDit(e.target.value)}
                  disabled={!communeActive}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FormField label="Prénom">
                <Input
                  name="firstName"
                  required
                  autoComplete="given-name"
                  placeholder="Votre prénom"
                />
              </FormField>
              <FormField label="Nom">
                <Input
                  name="lastName"
                  required
                  autoComplete="family-name"
                  placeholder="Votre nom"
                />
              </FormField>
            </div>

            <FormField label="Adresse email">
              <Input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="votre.email@exemple.com"
                value={email}
                onChange={(e) => setCredentials({ email: e.target.value })}
              />
            </FormField>

            <PasswordField
              value={password}
              onValueChange={(value) => setCredentials({ password: value })}
              onValidityChange={setPasswordValid}
              showLeadingIcon={false}
            />

            <label className="my-1.5 flex cursor-pointer items-center gap-2 py-1 text-xs leading-snug text-muted">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="size-4 shrink-0 rounded-sm accent-pink"
              />
              <span>
                J&apos;accepte les{" "}
                {TERMS_URL ? (
                  <a
                    href={TERMS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer font-semibold text-pink hover:underline"
                  >
                    Conditions d&apos;utilisation
                  </a>
                ) : (
                  <span className="font-semibold text-pink">
                    Conditions d&apos;utilisation
                  </span>
                )}{" "}
                et la{" "}
                {PRIVACY_URL ? (
                  <a
                    href={PRIVACY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer text-[9px] font-semibold text-pink hover:underline md:text-[10px]"
                  >
                    Politique de confidentialité
                  </a>
                ) : (
                  <span className="font-semibold text-pink">
                    Politique de confidentialité
                  </span>
                )}
              </span>
            </label>

            {signupState?.error?.form?.length ? (
              <div role="alert" className="space-y-1">
                {signupState.error.form.map((m) => (
                  <p key={m} className="text-xs font-medium text-coral">
                    {m}
                  </p>
                ))}
              </div>
            ) : null}
            {signupState?.error
              ? Object.entries(signupState.error)
                  .filter(([key]) => key !== "form")
                  .flatMap(([key, errs]) =>
                    (errs ?? []).map((msg) => (
                      <p
                        key={`${key}-${msg}`}
                        className="text-xs font-medium text-coral"
                        role="alert"
                      >
                        {msg}
                      </p>
                    )),
                  )
              : null}
          </div>

          <div className="flex flex-col gap-4">
            <Button
              type="submit"
              disabled={!canSubmit || signupPending}
              aria-busy={signupPending}
              className="w-full py-3 text-[15px] font-bold md:py-2.5"
            >
              {signupPending ? (
                <Loader2
                  className="size-[18px] animate-spin"
                  strokeWidth={2.5}
                  aria-hidden
                />
              ) : (
                <UserPlus
                  className="size-[18px]"
                  strokeWidth={2.5}
                  aria-hidden
                />
              )}
              {signupPending ? "Création en cours..." : "Créer mon compte"}
            </Button>

            <p className="text-center text-xs font-medium text-muted">
              Vous avez déjà un compte ?{" "}
              <Link
                href={ROUTES.connexion}
                className="cursor-pointer font-semibold text-purple underline"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </form>
      </div>

      <CommuneUnavailableModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        communeFeature={communeFeature}
        communeName={lookupName}
      />
    </>
  );
}
