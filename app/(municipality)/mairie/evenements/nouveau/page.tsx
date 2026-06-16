import { createEvent } from "@/lib/actions/events";
import { ROUTES } from "@/lib/constants/routes";
import { BackLink } from "@/components/ui/back-link";
import { GradientButton } from "@/components/ui/gradient-button";
import { Card } from "@/components/ui/card";
import { FormField, Input, Textarea } from "@/components/ui/form-field";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";

export default function MairieNouveauEvenementPage() {
  return (
    <PageStack gap="5">
      <BackLink href={ROUTES.mairie.dashboard}>← Tableau de bord</BackLink>
      <PageHeading title="Ajouter un événement officiel commun" />
      <Card className="space-y-3 p-6">
        <form action={createEvent} className="space-y-3">
          <FormField label="Titre">
            <Input required name="title" />
          </FormField>
          <FormField label="Description / consignes">
            <Textarea name="description" rows={4} />
          </FormField>
          <FormField label="Début">
            <Input type="datetime-local" name="startsAt" required />
          </FormField>
          <FormField label="Fin">
            <Input type="datetime-local" name="endsAt" required />
          </FormField>
          <FormField label="Lieu">
            <Input name="addressLabel" placeholder="Place de la Mairie" />
          </FormField>
          <GradientButton type="submit" gradient="events" className="w-full">
            Programmer l&apos;événement
          </GradientButton>
        </form>
      </Card>
      <p className="text-xs font-medium text-muted">
        Après redirection sur{" "}
        <strong className="text-text">{ROUTES.evenements.list}</strong>, vos administré·es
        le verront depuis l&apos;application résidentielle classique lorsque vos autorisations de
        rôle correspondent.
      </p>
    </PageStack>
  );
}
