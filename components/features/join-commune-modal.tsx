"use client";

import { startTransition, useActionState, useCallback, useState } from "react";
import { BanAutocomplete } from "@/components/features/ban-autocomplete";
import { CommuneUnavailableModal } from "@/components/features/auth/commune-unavailable-modal";
import type { BanFeature } from "@/lib/ban/client";
import { searchAddresses, searchMunicipalities } from "@/lib/ban/client";
import { joinCommune, switchCommune } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
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
  const [lookupLoading, setLookupLoading] = useState(false);
  const [interestOpen, setInterestOpen] = useState(false);
  const [addr, setAddr] = useState({
    label: "",
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
    setAddr({ label: "", postcode: "", lat: 0, lng: 0 });
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

      if (!row || row.subscription_status !== "active") {
        setStep("interest");
        setInterestOpen(true);
        return;
      }

      setAddr({
        label: "",
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
                setAddr({
                  label: feat.label,
                  postcode: feat.postcode,
                  lat: feat.lat,
                  lng: feat.lng,
                })
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
              <input type="hidden" name="addressLabel" value={addr.label} />
              <input type="hidden" name="addressCitycode" value={citycode} />
              <input type="hidden" name="addressPostcode" value={addr.postcode} />
              <input type="hidden" name="addressLat" value={String(addr.lat)} />
              <input type="hidden" name="addressLng" value={String(addr.lng)} />

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
                  type="submit"
                  disabled={
                    joinPending || addr.label.length < 5 || !addr.postcode
                  }
                  className="flex-1"
                >
                  Adhérer à cette commune
                </Button>
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
