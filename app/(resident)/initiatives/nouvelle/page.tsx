import { redirect } from "next/navigation";
import { createInitiative } from "@/lib/actions/initiatives";
import { ROUTES } from "@/lib/constants/routes";
import { CONTENT_CATEGORIES } from "@/lib/constants/content-categories";
import { BackLink } from "@/components/ui/back-link";
import { Card } from "@/components/ui/card";

// Wrapper to satisfy form action signature
async function handleCreateInitiative(formData: FormData): Promise<void> {
  "use server";
  await createInitiative(formData);
}
import { FormField, Input, Select, Textarea } from "@/components/ui/form-field";
import { GradientButton } from "@/components/ui/gradient-button";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";

async function submitInitiative(formData: FormData) {
  "use server";
  const { id } = await createInitiative(formData);
  redirect(ROUTES.initiatives.detail(id));
}

export default function NouvelleInitiativePage() {
  return (
    <PageStack gap="4">
      <BackLink href={ROUTES.initiatives.list}>← Liste</BackLink>
      <PageHeading
        title="Nouvelle initiative"
        subtitle="Lancez un projet collectif et invitez vos voisin·es à y participer."
      />
      <Card className="space-y-3 p-5 lg:max-w-2xl">
        <form action={submitInitiative} className="flex flex-col gap-3">
          <FormField label="Catégorie">
            <Select name="categorySlug" defaultValue="solidarite">
              {CONTENT_CATEGORIES.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Titre">
            <Input name="title" required minLength={3} placeholder="Court et mobilisateur" />
          </FormField>
          <FormField label="Description (objectifs inclus)">
            <Textarea
              name="description"
              rows={5}
              placeholder="Présentez le projet, ses objectifs et ce que vous attendez des participant·es…"
            />
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
          <FormField label="Lieu de rendez-vous (optionnel)">
            <Input name="locationLabel" placeholder="Ex. Parking du Pont Neuf" />
          </FormField>
          <FormField label="Photo principale · URL accessible (optionnel)">
            <Input type="url" name="photoUrl" placeholder="https://" />
          </FormField>
          <GradientButton type="submit" gradient="initiative" className="w-full">
            Publier l&apos;initiative
          </GradientButton>
        </form>
      </Card>
    </PageStack>
  );
}
