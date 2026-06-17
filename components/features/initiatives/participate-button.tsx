"use client";

import { useFormStatus } from "react-dom";
import { toggleInitiativeSupport } from "@/lib/actions/initiatives";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";

type Props = {
  initiativeId: string;
  isParticipating: boolean;
};

/** Toggle the viewer's participation on an initiative (progressive enhancement). */
export function ParticipateButton({ initiativeId, isParticipating }: Props) {
  return (
    <form action={async () => { await toggleInitiativeSupport(initiativeId); }} className="w-full">
      <SubmitButton isParticipating={isParticipating} />
    </form>
  );
}

function SubmitButton({ isParticipating }: { isParticipating: boolean }) {
  const { pending } = useFormStatus();

  if (isParticipating) {
    return (
      <Button
        type="submit"
        variant="secondary"
        disabled={pending}
        className="w-full"
      >
        {pending ? "…" : "Je participe ✓ · me retirer"}
      </Button>
    );
  }

  return (
    <GradientButton
      type="submit"
      gradient="initiative"
      disabled={pending}
      className="w-full"
    >
      {pending ? "…" : "Je veux participer"}
    </GradientButton>
  );
}
