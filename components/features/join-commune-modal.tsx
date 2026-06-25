"use client";

import { startTransition, useActionState, useCallback, useState } from "react";
import { BanAutocomplete } from "@/components/features/ban-autocomplete";
import { CommuneUnavailableModal } from "@/components/features/auth/commune-unavailable-modal";
import type { BanFeature } from "@/lib/ban/client";
import { searchAddresses, searchMunicipalities } from "@/lib/ban/client";
import { joinCommune, switchCommune } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import type { Commune, Membership } from "@/lib/types";

type LookupResponse = { commune: Commune | null; error?: string };

type JoinState =
  | { error: Partial<Record<string, string[] | undefined>> }
  | undefined;

type Props = {
  open: boolean;
  onClose: () => void;
  existingMemberships: Membership[];
};

export function JoinCommuneModal({
  open,
  onClose,
  existingMemberships,
}: Props) {
  const [step, setStep] = useState<"commune" | "address" | "interest">("commune");
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

  function handleClose() {
    reset();
    onClose();
  }

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
      handleClose();
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

      if (!row || (row.access_status !== "active" && row.access_status !== "trial")) {
        setStep("interest");
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
      <Modal
        open={open && !interestOpen}
        onClose={handleClose}
        title={
          step === "address"
            ? "Votre adresse dans la commune"
            : "Adhérer à une commune"
        }
        size="md"
      >
        {step === "commune" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Recherchez la commune à laquelle vous souhaitez adhérer, comme lors
              de votre inscription.
            </p>
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
        ) : null}

        {step === "address" && communeMeta ? (
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
              <input type="hidden" name="trialAccessCode" value={trialAccessCode} />
              <input type="hidden" name="addressCity" value={addr.city} />
              <input type="hidden" name="addressCitycode" value={citycode} />
              <input type="hidden" name="addressPostcode" value={addr.postcode} />
              <input type="hidden" name="addressLat" value={String(addr.lat)} />
              <input type="hidden" name="addressLng" value={String(addr.lng)} />

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
                    <p className="mt-1 text-xs font-medium text-coral" role="alert">
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
                  onClick={() => {
                    setStep("commune");
                    setCommuneMeta(null);
                  }}
                >
                  Changer de commune
                </Button>
                <Button
                  type="submit"
                  disabled={joinPending || !addr.postcode || !addr.city}
                  className="flex-1"
                >
                  Adhérer à cette commune
                </Button>
              </div>
            </form>
          </div>
        ) : null}
      </Modal>

      <CommuneUnavailableModal
        open={interestOpen}
        onClose={() => {
          setInterestOpen(false);
          handleClose();
        }}
        communeFeature={communeMeta}
        communeName={lookupCommune?.name ?? communeMeta?.city}
      />
    </>
  );
}
