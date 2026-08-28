"use client";

import { startTransition, useActionState, useCallback, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { BanAutocomplete } from "@/components/features/ban-autocomplete";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/form-field";
import type { BanFeature } from "@/lib/ban/client";
import { searchAddresses } from "@/lib/ban/client";
import { formatStreetDisplay } from "@/lib/ban/display";
import { acceptInvitation } from "@/lib/actions/staff-invitation";

type ActionState =
  | { error?: Record<string, string[] | undefined> }
  | undefined;

type Props = {
  communeName: string;
  communeCitycode: string;
  inviteToken: string;
};

export function InvitationAddressForm({ communeName, communeCitycode, inviteToken }: Props) {
  const [street, setStreet] = useState("");
  const [city, setCity] = useState(communeName);
  const [postcode, setPostcode] = useState("");
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);

  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionState, fd: FormData) =>
      acceptInvitation(fd) as Promise<ActionState>,
    undefined,
  );

  const onPickStreet = useCallback((feature: BanFeature) => {
    setStreet(formatStreetDisplay(feature.label));
    setPostcode(feature.postcode ?? "");
    setLat(feature.lat);
    setLng(feature.lng);
  }, []);

  const fetchSuggestions = useCallback(
    (query: string) => searchAddresses(query, communeCitycode),
    [communeCitycode],
  );

  const canSubmit = street.trim().length > 0 && postcode.length >= 4 && !isPending;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => { formAction(fd); });
      }}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="token" value={inviteToken} />
      <input type="hidden" name="addressStreet" value={street} />
      <input type="hidden" name="addressCity" value={city} />
      <input type="hidden" name="addressCitycode" value={communeCitycode} />
      <input type="hidden" name="addressPostcode" value={postcode} />
      <input type="hidden" name="addressLat" value={String(lat)} />
      <input type="hidden" name="addressLng" value={String(lng)} />

      <p className="text-sm font-medium text-muted">
        Pour finaliser, renseignez votre adresse dans la commune.
      </p>

      <BanAutocomplete
        label="Rue"
        placeholder="Numéro, rue..."
        fetchSuggestions={fetchSuggestions}
        onSelect={onPickStreet}
        value={street || undefined}
        formatSuggestion={(f) => formatStreetDisplay(f.label)}
      />

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Code postal">
          <Input
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            placeholder="27000"
            inputMode="numeric"
          />
        </FormField>
        <FormField label="Commune">
          <Input value={city} onChange={(e) => setCity(e.target.value)} readOnly />
        </FormField>
      </div>

      {state?.error?.form?.length ? (
        <div role="alert" className="space-y-1">
          {state.error.form.map((m) => (
            <p key={m} className="text-xs font-medium text-coral">{m}</p>
          ))}
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={!canSubmit}
        aria-busy={isPending}
        className="w-full py-3 text-[15px] font-bold md:py-2.5"
      >
        {isPending ? (
          <Loader2 className="size-4.5 animate-spin" strokeWidth={2.5} aria-hidden />
        ) : (
          <MapPin className="size-4.5" strokeWidth={2.5} aria-hidden />
        )}
        {isPending ? "Acceptation en cours..." : "Accepter l'invitation"}
      </Button>
    </form>
  );
}
