import { Card } from "@/components/ui/card";
import { FormField, Input, Textarea } from "@/components/ui/form-field";
import { GradientButton } from "@/components/ui/gradient-button";
import { PageHeading } from "@/components/ui/page-heading";
import { updateCommuneWelcomeMessage } from "@/lib/actions/municipality";

export default function MairieParametresPage() {
  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-6">
        <PageHeading
          title="Paramètres communaux"
          subtitle="Ajustez prochainement l'humeur générale : téléphone Mairie public, horaires d'accueil, message d'entête…"
        />
      </Card>
      <Card className="space-y-3 p-6">
        <form action={updateCommuneWelcomeMessage} className="space-y-3">
          <FormField label="Message d'accueil empathique affiché sur le portail Vie Locale communal">
            <Textarea
              name="welcomeMessage"
              rows={4}
              placeholder="Une phrase humaine avant les procédures…"
            />
          </FormField>
          <FormField label="Horaires d'ouverture">
            <Textarea name="openingHours" rows={2} placeholder="Lun-Ven …" />
          </FormField>
          <FormField label="Téléphone public">
            <Input name="phone" />
          </FormField>
          <FormField label="Adresse administrative">
            <Input name="address" />
          </FormField>
          <FormField label="Référent·e">
            <Input name="referentName" />
          </FormField>
          <FormField label="Fonction">
            <Input name="referentRole" />
          </FormField>
          <GradientButton type="submit" gradient="initiative" className="w-full">
            Enregistrer les informations chaleureuses
          </GradientButton>
        </form>
      </Card>
    </div>
  );
}
