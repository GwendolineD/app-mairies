"use client";

import Link from "next/link";
import { startTransition, useActionState, useCallback, useState } from "react";
import { BanAutocomplete } from "@/components/features/ban-autocomplete";
import type { BanFeature } from "@/lib/ban/client";
import { searchAddresses, searchMunicipalities } from "@/lib/ban/client";
import { signUp, submitCommuneInterest } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import type { Commune } from "@/lib/types";

type LookupResponse = { commune: Commune | null; error?: string };

type InterestState = { error?: string; success?: boolean };

type SignupErrorField = Partial<Record<string, string[] | undefined>>;

type SignUpState = { error: SignupErrorField } | undefined;

export function InscriptionFlow() {
  const [step, setStep] = useState<"commune" | "interest" | "signup">(
    "commune",
  );
  const [inseeLoading, setInseeLoading] = useState(false);
  const [communeMeta, setCommuneMeta] = useState<BanFeature | null>(null);
  const [lookupCommune, setLookupCommune] = useState<Commune | null>(null);

  const [interestState, interestAction] = useActionState(
    async (_: InterestState | undefined, formData: FormData) =>
      submitCommuneInterest(formData),
    undefined as InterestState | undefined,
  );

  const [signupState, signupAction, signupPending] = useActionState(
    async (_prev: SignUpState | undefined, formData: FormData) =>
      signUp(formData) as Promise<SignUpState>,
    undefined,
  );

  const onPickCommune = useCallback(async (feature: BanFeature) => {
    setCommuneMeta(feature);
    setInseeLoading(true);
    try {
      const params = new URLSearchParams({
        inseeCode: feature.citycode,
      });
      const res = await fetch(`/api/communes/lookup?${params}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as LookupResponse;
      if (!res.ok) {
        setLookupCommune(null);
        setStep("interest");
        return;
      }

      const row = json.commune;
      setLookupCommune(row ?? null);

      if (!row) {
        setStep("interest");
        return;
      }

      if (row.subscription_status !== "active") {
        setStep("interest");
      } else {
        setStep("signup");
      }
    } finally {
      setInseeLoading(false);
    }
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-4">
      <div className="text-center">
        <PageHeading
          centered
          title="Inscription"
          subtitle="Choisissez votre commune, puis complétez votre profil lorsque le service est ouvert dans votre commune."
        />
      </div>

      {step === "commune" && (
        <Card className="p-6">
          <BanAutocomplete
            label="Ta commune ou nom de commune"
            placeholder="Ex : Les Authieux, Rouen..."
            fetchSuggestions={(q) => searchMunicipalities(q)}
            onSelect={(f) => void onPickCommune(f)}
          />
          {inseeLoading ? (
            <p className="mt-4 text-center text-xs text-muted">
              Vérification de votre commune...
            </p>
          ) : null}
          <OptionalInterestLink />
        </Card>
      )}

      {step === "interest" && communeMeta ? (
        <Card className="p-6">
          <div className="mb-4">
            <p className="text-sm font-semibold text-text">
              {lookupCommune ? (
                <>
                  «&nbsp;{lookupCommune.name}&nbsp;» n&apos;a pas encore activé le service
                  pour les habitant·es.
                </>
              ) : (
                <>
                  Nous cherchons «&nbsp;
                  <span className="text-purple">{communeMeta.city}</span>&nbsp;» mais la
                  fiche officielle n&apos;est pas encore visible dans Vie Locale sous ce
                  code INSEE&nbsp;: vos coordonnées aident nos équipes et la mairie à
                  accélérer l&apos;ouverture locale.
                </>
              )}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Laissez un e-mail : nous préviendrons vos élu·es dès que la commune est
              prête pour les habitant·es.
            </p>
          </div>
          <form action={interestAction} className="flex flex-col gap-3">
            <input type="hidden" name="inseeCode" value={communeMeta.citycode} />
            <label className="text-sm font-medium text-text">
              E-mail pour être recontacté·e
              <input
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
                placeholder="vous@domaine.fr"
              />
            </label>
            <label className="text-sm font-medium text-text">
              Message (optionnel)
              <textarea
                name="message"
                rows={3}
                className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
              />
            </label>
            {interestState?.error ? (
              <p role="alert" className="text-xs text-coral">
                {interestState.error}
              </p>
            ) : null}
            {interestState?.success ? (
              <p className="text-xs font-medium text-mint">
                Merci&nbsp;! Vous recevrez bientôt des nouvelles.
              </p>
            ) : null}
            <Button type="submit" className="w-full rounded-full py-3">
              Notifier ma commune
            </Button>
          </form>
          <InterestBack onBack={() => setStep("commune")} />
        </Card>
      ) : null}

      {step === "signup" && communeMeta ? (
        <SignupWithAddressSection
          communeMeta={communeMeta}
          signupAction={signupAction}
          signupPending={signupPending}
          signupState={signupState}
          citycode={communeMeta.citycode}
          onRestart={() => setStep("commune")}
        />
      ) : null}
    </div>
  );
}

function SignupWithAddressSection(props: {
  communeMeta: BanFeature;
  citycode: string;
  signupAction: (payload: FormData) => void;
  signupPending: boolean;
  signupState: SignUpState;
  onRestart(): void;
}) {
  const { communeMeta, citycode } = props;
  const [addr, setAddr] = useState({
    label: "",
    postcode: communeMeta.postcode ?? "",
    lat: communeMeta.lat,
    lng: communeMeta.lng,
  });

  return (
    <Card className="p-6">
      <AddressFields
        citycode={citycode}
        onSelect={(feat) =>
          setAddr({
            label: feat.label,
            postcode: feat.postcode,
            lat: feat.lat,
            lng: feat.lng,
          })
        }
        valueLabel={addr.label}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          startTransition(() => {
            props.signupAction(formData);
          });
        }}
        className="mt-6 flex flex-col gap-3"
      >
        <input type="hidden" name="inseeCode" value={citycode} />
        <input type="hidden" name="addressLabel" value={addr.label} />
        <input type="hidden" name="addressCitycode" value={citycode} />
        <input type="hidden" name="addressPostcode" value={addr.postcode} />
        <input type="hidden" name="addressLat" value={String(addr.lat)} />
        <input type="hidden" name="addressLng" value={String(addr.lng)} />

        <FormField label="Prénom" name="firstName" required />
        <FormField label="Nom" name="lastName" required />
        <FormField label="E-mail" name="email" type="email" required />
        <FormField
          label="Mot de passe (8 caractères min.)"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />

        {props.signupState?.error?.form?.length ? (
          <div role="alert" className="space-y-1">
            {props.signupState.error.form.map((m) => (
              <p key={m} className="text-xs text-coral">
                {m}
              </p>
            ))}
          </div>
        ) : null}
        {props.signupState?.error
          ? Object.entries(props.signupState.error)
              .filter(([key]) => key !== "form")
              .flatMap(([key, errs]) =>
                (errs ?? []).map((msg, idx) => (
                  <p key={`${key}-${idx}`} className="text-xs text-coral" role="alert">
                    {`${key}: ${msg}`}
                  </p>
                )),
              )
          : null}

        <Button
          type="submit"
          disabled={
            props.signupPending || addr.label.length < 5 || !addr.postcode
          }
          className="w-full rounded-full py-3"
        >
          Finaliser mon inscription
        </Button>
      </form>

      <Button
        type="button"
        variant="ghost"
        className="mt-4 w-full text-xs font-medium underline"
        onClick={() => props.onRestart()}
      >
        Changer de commune
      </Button>
    </Card>
  );
}

function AddressFields(props: {
  citycode: string;
  onSelect(feat: BanFeature): void;
  valueLabel: string;
}) {
  const { citycode, onSelect, valueLabel } = props;

  const fetchSuggestions = useCallback(
    (q: string) => searchAddresses(q, citycode),
    [citycode],
  );

  return (
    <BanAutocomplete
      label="Ton adresse précise dans la commune"
      placeholder="Numéro, rue..."
      fetchSuggestions={fetchSuggestions}
      onSelect={onSelect}
      value={valueLabel}
      disabled={!citycode}
    />
  );
}

function FormField(props: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  autoComplete?: string;
}) {
  const { label, name, required, type = "text", autoComplete } = props;
  return (
    <label className="text-sm font-medium text-text">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
      />
    </label>
  );
}

function OptionalInterestLink() {
  return (
    <p className="mt-6 text-center text-xs text-muted">
      Vous ne voyez pas la bonne commune ? {""}
      <Link href="/inscription/interet" className="font-semibold text-purple">
        Déclarer un intérêt
      </Link>
    </p>
  );
}

function InterestBack(props: { onBack(): void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="mt-4 w-full text-sm font-medium underline"
      onClick={props.onBack}
    >
      Choisir une autre commune
    </Button>
  );
}
