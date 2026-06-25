"use client";

import { startTransition, useActionState, useCallback, useState } from "react";
import { BanAutocomplete } from "@/components/features/ban-autocomplete";
import { CommuneUnavailableModal } from "@/components/features/auth/commune-unavailable-modal";
import type { BanFeature } from "@/lib/ban/client";
import { searchAddresses, searchMunicipalities } from "@/lib/ban/client";
import { joinCommune, signOut, switchCommune } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/form-field";
import { PageHeading } from "@/components/ui/page-heading";
import type { Commune, Membership } from "@/lib/types";

type LookupResponse = { commune: Commune | null; error?: string };

type JoinState =
  | { error: Partial<Record<string, string[] | undefined>> }
  | undefined;

type Props = {
  existingMemberships: Membership[];
};

export function JoinCommuneFlow({ existingMemberships }: Props) {
  const [step, setStep] = useState<"commune" | "address">("commune");
  const [communeMeta, setCommuneMeta] = useState<BanFeature | null>(null);
  const [lookupCommune, setLookupCommune] = useState<Commune | null>(null);
  const [communeIsTrial, setCommuneIsTrial] = useState(false);
  const [trialAccessCode, setTrialAccessCode] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [interestOpen, setInterestOpen] = useState(false);
  const [addr, setAddr] = useState({
    label: "",
    city: "",
    postcode: "",
    lat: 0,
    lng: 0,
  });

  const [joinState, joinAction, joinPending] = useActionState(
    async (_prev: JoinState, formData: FormData) =>
      joinCommune(formData) as Promise<JoinState>,
    undefined,
  );

  const reset = useCallback(() => {
    setStep("commune");
    setCommuneMeta(null);
    setLookupCommune(null);
    setCommuneIsTrial(false);
    setTrialAccessCode("");
    setAddr({ label: "", city: "", postcode: "", lat: 0, lng: 0 });
    setInterestOpen(false);
  }, []);

  async function onPickCommune(feature: BanFeature) {
    const alreadyMember = existingMemberships.find(
      (m) =>
        m.commune?.insee_code === feature.citycode &&
        (m.status === "active" || m.status === "suspended"),
    );
    if (alreadyMember?.commune_id) {
      startTransition(() => {
        void switchCommune(alreadyMember.commune_id);
      });
      return;
    }

    setCommuneMeta(feature);
    setLookupLoading(true);
    try {
      const params = new URLSearchParams({ inseeCode: feature.citycode });
      const res = await fetch(`/api/communes/lookup?${params}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as LookupResponse;
      const row = json.commune ?? null;
      setLookupCommune(row);

      if (
        !row ||
        (row.access_status !== "active" && row.access_status !== "trial")
      ) {
        setInterestOpen(true);
        return;
      }

      setCommuneIsTrial(row.access_status === "trial");
      setAddr({
        label: "",
        city: row.name ?? feature.city ?? "",
        postcode: feature.postcode ?? row.postcode ?? "",
        lat: feature.lat,
        lng: feature.lng,
      });
      setStep("address");
    } finally {
      setLookupLoading(false);
    }
  }

  const citycode = communeMeta?.citycode ?? "";

  return (
    <>
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <PageHeading
          centered
          title="Rejoindre une commune"
          subtitle="Recherchez votre commune puis renseignez votre adresse pour la rejoindre."
        />

        {step === "commune" && (
          <Card className="p-6">
            <div className="space-y-4">
              <BanAutocomplete
                label="Commune"
                placeholder="Ex : Les Authieux, Rouen..."
                fetchSuggestions={(q) => searchMunicipalities(q)}
                onSelect={(f) => void onPickCommune(f)}
              />
              {lookupLoading ? (
                <p className="text-center text-xs text-muted">
                  Vérification de la commune…
                </p>
              ) : null}
            </div>
          </Card>
        )}

        {step === "address" && communeMeta ? (
          <Card className="p-6">
            <div className="space-y-4">
              <p className="text-sm font-semibold text-text">
                {lookupCommune?.name ?? communeMeta.city}
              </p>
              <BanAutocomplete
                label="Votre adresse dans cette commune"
                placeholder="Numéro, rue..."
                fetchSuggestions={(q) => searchAddresses(q, citycode)}
                onSelect={(feat) =>
                  setAddr((prev) => ({
                    ...prev,
                    label: feat.label,
                    postcode: feat.postcode,
                    lat: feat.lat,
                    lng: feat.lng,
                  }))
                }
                value={addr.label}
                disabled={!citycode}
              />

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  startTransition(() => {
                    joinAction(formData);
                  });
                }}
                className="space-y-3"
              >
                <input type="hidden" name="inseeCode" value={citycode} />
                <input
                  type="hidden"
                  name="trialAccessCode"
                  value={trialAccessCode}
                />
                <input type="hidden" name="addressCity" value={addr.city} />
                <input
                  type="hidden"
                  name="addressCitycode"
                  value={citycode}
                />
                <input
                  type="hidden"
                  name="addressPostcode"
                  value={addr.postcode}
                />
                <input
                  type="hidden"
                  name="addressLat"
                  value={String(addr.lat)}
                />
                <input
                  type="hidden"
                  name="addressLng"
                  value={String(addr.lng)}
                />

                {communeIsTrial ? (
                  <FormField label="Code d'accès essai">
                    <Input
                      autoComplete="off"
                      placeholder="VL-XXXXX"
                      value={trialAccessCode}
                      onChange={(e) =>
                        setTrialAccessCode(e.target.value.toUpperCase())
                      }
                    />
                    {joinState?.error?.trialAccessCode?.length ? (
                      <p
                        className="mt-1 text-xs font-medium text-coral"
                        role="alert"
                      >
                        {joinState.error.trialAccessCode[0]}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-muted">
                      Cette commune est en période d&apos;essai. Entrez le code
                      communiqué par la mairie.
                    </p>
                  </FormField>
                ) : null}

                {joinState?.error?.form?.map((msg) => (
                  <p key={msg} role="alert" className="text-xs text-coral">
                    {msg}
                  </p>
                ))}
                {joinState?.error
                  ? Object.entries(joinState.error)
                      .filter(([key]) => key !== "form")
                      .flatMap(([key, errs]) =>
                        (errs ?? []).map((msg, idx) => (
                          <p
                            key={`${key}-${idx}`}
                            role="alert"
                            className="text-xs text-coral"
                          >
                            {msg}
                          </p>
                        )),
                      )
                  : null}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={reset}
                  >
                    Changer de commune
                  </Button>
                  <Button
                    type="submit"
                    disabled={joinPending || !addr.postcode || !addr.city}
                    className="flex-1"
                  >
                    Rejoindre cette commune
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        )}

        <p className="text-center text-xs text-muted">
          Vous souhaitez utiliser un autre compte ?{" "}
          <button
            type="button"
            onClick={() => startTransition(() => void signOut())}
            className="cursor-pointer font-semibold text-purple hover:underline"
          >
            Se déconnecter
          </button>
        </p>
      </div>

      <CommuneUnavailableModal
        open={interestOpen}
        onClose={() => {
          setInterestOpen(false);
          reset();
        }}
        communeFeature={communeMeta}
        communeName={lookupCommune?.name ?? communeMeta?.city}
      />
    </>
  );
}
