"use client";

import { startTransition, useActionState, useCallback, useState } from "react";
import Link from "next/link";
import { Mail, MapPin, User, UserPlus, Users } from "lucide-react";
import { BanAutocomplete } from "@/components/features/ban-autocomplete";
import { useAuthCredentials } from "@/components/features/auth/auth-credentials-provider";
import { CommuneUnavailableModal } from "@/components/features/auth/commune-unavailable-modal";
import { Button } from "@/components/ui/button";
import { IconField, IconInput } from "@/components/ui/icon-field";
import { PasswordField, PASSWORD_RULE } from "@/components/ui/password-field";
import type { BanFeature } from "@/lib/ban/client";
import { searchMunicipalities } from "@/lib/ban/client";
import { formatMunicipalityDisplay } from "@/lib/ban/display";
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
  const [addr, setAddr] = useState<AddressDraft>({
    city: "",
    postcode: "",
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
          lat: row.centroid_lat ?? feature.lat,
          lng: row.centroid_lng ?? feature.lng,
        });
      } else {
        setLookupName(row?.name ?? feature.city);
        setModalOpen(true);
        setAddr({ city: "", postcode: "", lat: 0, lng: 0 });
      }
    } finally {
      setCommuneLoading(false);
    }
  }, []);

  const canSubmit =
    communeActive &&
    communeFeature &&
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
            <input type="hidden" name="inseeCode" value={communeFeature.citycode} />
          ) : null}
          <input type="hidden" name="addressCity" value={addr.city} />
          <input
            type="hidden"
            name="addressCitycode"
            value={communeFeature?.citycode ?? ""}
          />
          <input type="hidden" name="addressPostcode" value={addr.postcode} />
          <input type="hidden" name="addressLat" value={String(addr.lat)} />
          <input type="hidden" name="addressLng" value={String(addr.lng)} />
          <input
            type="hidden"
            name="acceptedTerms"
            value={acceptedTerms ? "true" : ""}
          />

          <BanAutocomplete
            label="Ma commune"
            placeholder="Les Authieux"
            fetchSuggestions={(q) => searchMunicipalities(q)}
            onSelect={(f) => void onPickCommune(f)}
            value={
              communeFeature
                ? formatMunicipalityDisplay(communeFeature)
                : undefined
            }
            formatSuggestion={formatMunicipalityDisplay}
            leadingIcon={MapPin}
            showChevron
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

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <IconField label="Prénom" icon={User}>
              <IconInput
                name="firstName"
                required
                autoComplete="given-name"
                placeholder="Votre prénom"
              />
            </IconField>
            <IconField label="Nom" icon={User}>
              <IconInput
                name="lastName"
                required
                autoComplete="family-name"
                placeholder="Votre nom"
              />
            </IconField>
          </div>

          <IconField label="Adresse email" icon={Mail}>
            <IconInput
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="votre.email@exemple.com"
              value={email}
              onChange={(e) => setCredentials({ email: e.target.value })}
            />
          </IconField>

          <PasswordField
            value={password}
            onValueChange={(value) => setCredentials({ password: value })}
            onValidityChange={setPasswordValid}
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
              disabled={!canSubmit}
              className="w-full py-3 text-[15px] font-bold md:py-2.5"
            >
              <UserPlus className="size-[18px]" strokeWidth={2.5} aria-hidden />
              Créer mon compte
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
