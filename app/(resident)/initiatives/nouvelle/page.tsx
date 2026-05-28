import { createInitiative } from "@/lib/actions/initiatives";
import { ROUTES } from "@/lib/constants/routes";
import { BackLink } from "@/components/ui/back-link";
import { Card } from "@/components/ui/card";
import { FormField, Input, Select, Textarea } from "@/components/ui/form-field";
import { GradientButton } from "@/components/ui/gradient-button";
import { PageHeading } from "@/components/ui/page-heading";

export default function NouvelleInitiativePage() {
  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <BackLink href={ROUTES.initiatives.list}>← Liste</BackLink>
      <PageHeading title="Nouvelle initiative" />
      <Card className="space-y-3 p-5">
        <form action={createInitiative} className="flex flex-col gap-3">
          <FormField label="Titre">
            <Input name="title" required />
          </FormField>
          <FormField label="Description optionnelle">
            <Textarea name="description" rows={4} />
          </FormField>
          <FormField label="Temporalité">
            <Select name="dateMode">
              <option value="none">Libre / permanente</option>
              <option value="once">Événement ponctuel</option>
              <option value="recurring">Récurrent (règle à préciser ensuite)</option>
            </Select>
          </FormField>
          <fieldset className="space-y-2 rounded-2xl border border-border px-4 py-3">
            <legend className="px-2 text-[10px] font-semibold uppercase text-muted">
              Si ponctuelle
            </legend>
            <FormField label="Début" className="text-xs">
              <Input type="datetime-local" name="singleStartsAt" className="px-3 py-2 text-xs" />
            </FormField>
            <FormField label="Fin" className="text-xs">
              <Input type="datetime-local" name="singleEndsAt" className="px-3 py-2 text-xs" />
            </FormField>
          </fieldset>
          <GradientButton type="submit" gradient="initiative" className="w-full">
            Publier l&apos;initiative
          </GradientButton>
        </form>
      </Card>
    </div>
  );
}
