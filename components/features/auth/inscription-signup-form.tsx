"use client";

import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
import { signUp, resendVerificationEmail } from "@/lib/actions/auth";
import { ROUTES } from "@/lib/constants/routes";
import type { Commune } from "@/lib/types";

type LookupResponse = { commune: Commune | null; error?: string };

type SignupErrorField = Partial<Record<string, string[] | undefined>>;
type SignUpState =
  | { error: SignupErrorField }
  | { emailConfirmationRequired: true; emailSendWarning?: boolean }
  | undefined;

type ResendState =
  | { error?: string; success?: boolean }
  | undefined;

type AddressDraft = {
  city: string;
  postcode: string;
  street: string;
  lat: number;
  lng: number;
};

type Props = {
  prefillInseeCode?: string;
  prefillEmail?: string;
  inviteToken?: string;
  inviteCommuneName?: string;
  inviteRoleLabel?: string;
};

export function InscriptionSignupForm({
  prefillInseeCode,
  prefillEmail,
  inviteToken,
  inviteCommuneName,
  inviteRoleLabel,
}: Props = {}) {
  const { email, password, setCredentials } = useAuthCredentials();
  const [communeFeature, setCommuneFeature] = useState<BanFeature | null>(null);
  const [communeActive, setCommuneActive] = useState(false);
  const [communeIsTrial, setCommuneIsTrial] = useState(false);
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

  const prefillDone = useRef(false);

  useEffect(() => {
    if (prefillEmail && !email) {
      setCredentials({ email: prefillEmail });
    }
  }, [prefillEmail, email, setCredentials]);

  useEffect(() => {
    if (!prefillInseeCode || prefillDone.current) return;
    prefillDone.current = true;

    (async () => {
      setCommuneLoading(true);
      try {
        const params = new URLSearchParams({ inseeCode: prefillInseeCode });
        const res = await fetch(`/api/communes/lookup?${params}`, {
          cache: "no-store",
        });
        const json = (await res.json()) as LookupResponse;
        const row = json.commune;

        if (row && (row.access_status === "active" || row.access_status === "trial")) {
          setCommuneActive(true);
          setCommuneIsTrial(row.access_status === "trial");
          setLookupName(row.name);
          setCommuneFeature({
            citycode: row.insee_code,
            city: row.name,
            postcode: row.postcode ?? "",
            label: row.name,
            lat: row.centroid_lat ?? 0,
            lng: row.centroid_lng ?? 0,
          } as BanFeature);
          setAddr({
            city: row.name ?? "",
            postcode: row.postcode ?? "",
            street: "",
            lat: row.centroid_lat ?? 0,
            lng: row.centroid_lng ?? 0,
          });
        }
      } finally {
        setCommuneLoading(false);
      }
    })();
  }, [prefillInseeCode]);

  const [signupState, signupAction, signupPending] = useActionState(
    async (_prev: SignUpState | undefined, formData: FormData) =>
      signUp(formData) as Promise<SignUpState>,
    undefined,
  );
  const [resendState, resendAction, resendPending] = useActionState(
    async (_: ResendState, fd: FormData) => resendVerificationEmail(fd),
    undefined as ResendState,
  );

  const onPickCommune = useCallback(async (feature: BanFeature) => {
    setCommuneFeature(feature);
    setCommuneActive(false);
    setCommuneIsTrial(false);
    setCommuneLoading(true);

    try {
      const params = new URLSearchParams({ inseeCode: feature.citycode });
      const res = await fetch(`/api/communes/lookup?${params}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as LookupResponse;
      const row = json.commune;

      if (row?.access_status === "active" || row?.access_status === "trial") {
        setCommuneActive(true);
        setCommuneIsTrial(row.access_status === "trial");
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
    // eslint-disable-next-line react-hooks/preserve-manual-memoization -- Narrow deps to citycode only; full communeFeature would retrigger address search too often.
    (query: string) => {
      if (!communeFeature?.citycode) return Promise.resolve([]);
      return searchAddresses(query, communeFeature.citycode);
    },
    [communeFeature?.citycode],
  );

  const blockedByTrial = communeIsTrial && !inviteToken;

  const canSubmit =
    communeActive &&
    communeFeature &&
    !blockedByTrial &&
    addr.street.trim().length > 0 &&
    addr.postcode.trim().length >= 4 &&
    acceptedTerms &&
    passwordValid &&
    !signupPending;

  if (signupState && "emailConfirmationRequired" in signupState) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto rounded-none bg-transparent px-6 py-12 text-center shadow-none md:rounded-3xl md:bg-surface md:px-12 md:py-8 md:shadow-elevated">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-mint/20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-7 text-mint"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-text">
          Vérifiez votre boîte mail
        </h2>
        <p className="mt-3 max-w-sm text-sm text-muted">
          Un email de confirmation vous a été envoyé. Cliquez sur le lien qu&apos;il
          contient pour activer votre compte et accéder à l&apos;application.
        </p>
        {signupState.emailSendWarning ? (
          <p
            className="mt-4 max-w-sm rounded-md bg-soft-pink px-3 py-2 text-xs font-medium text-coral"
            role="alert"
          >
            L&apos;envoi de l&apos;e-mail a échoué. Utilisez le bouton
            ci-dessous pour le renvoyer.
          </p>
        ) : null}
        <div className="mt-6 space-y-3">
          {resendState?.success ? (
            <p
              className="max-w-sm rounded-md border border-mint/30 bg-mint/10 px-3 py-2 text-xs font-medium text-text"
              role="status"
            >
              Si un compte non confirmé existe avec cette adresse, un nouvel
              e-mail de vérification vient d&apos;être envoyé. Pensez à
              vérifier vos spams.
            </p>
          ) : null}
          {resendState?.error ? (
            <p
              className="max-w-sm rounded-md bg-soft-pink px-3 py-2 text-xs font-medium text-coral"
              role="alert"
            >
              {resendState.error}
            </p>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={resendPending || !email.trim()}
            onClick={() => {
              const formData = new FormData();
              formData.set("email", email);
              startTransition(() => {
                resendAction(formData);
              });
            }}
          >
            {resendPending ? "Envoi en cours…" : "Renvoyer l'e-mail"}
          </Button>
          <p className="text-xs text-subtle">
            <Link
              href={ROUTES.connexion}
              className="cursor-pointer font-semibold text-purple hover:underline"
            >
              Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-none bg-transparent px-0 py-0 shadow-none md:rounded-3xl md:bg-surface md:px-12 md:py-8 md:shadow-elevated">
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
            {inviteToken ? (
              <input type="hidden" name="inviteToken" value={inviteToken} />
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

            {inviteToken && inviteCommuneName ? (
              <div className="rounded-md border border-purple/20 bg-purple/5 px-4 py-3 text-center text-sm font-medium text-text">
                Vous rejoindrez <span className="font-bold">{inviteCommuneName}</span>
                {inviteRoleLabel ? (
                  <> en tant que <span className="font-semibold text-purple">{inviteRoleLabel}</span></>
                ) : null}
              </div>
            ) : null}

            {!inviteToken ? (
              <>
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

                {communeIsTrial && communeActive ? (
                  <div className="rounded-md border border-orange/30 bg-sun/10 px-4 py-3 text-sm font-medium text-text">
                    Cette commune est en période d&apos;essai.
                    Demandez une invitation à la mairie pour vous inscrire.
                  </div>
                ) : null}
              </>
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

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <FormField
                label="Code postal"
                className="w-2/5 md:col-span-1 md:w-auto"
                labelClassName="whitespace-nowrap"
              >
                <Input
                  name="addressPostcode"
                  required
                  autoComplete="postal-code"
                  inputMode="numeric"
                  placeholder="27000"
                  className="text-right md:text-left"
                  value={addr.postcode}
                  onChange={(e) =>
                    setAddr((prev) => ({ ...prev, postcode: e.target.value }))
                  }
                  disabled={!communeActive}
                />
              </FormField>

              <FormField label="Lieu-dit (optionnel)" className="md:col-span-3">
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
                readOnly={!!inviteToken}
                className={inviteToken ? "bg-warm text-muted" : ""}
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
                <Link
                  href={ROUTES.legal.cgu}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer font-semibold text-pink hover:underline"
                >
                  Conditions d&apos;utilisation
                </Link>{" "}
                et la{" "}
                <Link
                  href={ROUTES.legal.privacy}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer font-semibold text-pink hover:underline"
                >
                  Politique de confidentialité
                </Link>
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
