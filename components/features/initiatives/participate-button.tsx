// @ts-nocheck
"use client";

import { useFormStatus } from "react-dom";
import { toggleInitiativeParticipation } from "@/lib/actions/initiatives";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";

type Props = {
  initiativeId: string;
  isParticipating: boolean;
};

/** Toggle the viewer's participation on an initiative (progressive enhancement). */
export function ParticipateButton({ initiativeId, isParticipating }: Props) {
  return (
    <form action={toggleInitiativeParticipation} className="w-full">
      <input type="hidden" name="id" value={initiativeId} />
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
