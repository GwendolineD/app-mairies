import { Card } from "@/components/ui/card";
import { FormField, Input, Textarea } from "@/components/ui/form-field";
import { GradientButton } from "@/components/ui/gradient-button";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { updateCommuneWelcomeMessage } from "@/lib/actions/municipality";
import { requireRole } from "@/lib/auth/session";
import { NEIGHBOR_INVITE_TEMPLATE_KEY } from "@/lib/constants/email-templates";
import { USER_ROLES } from "@/lib/constants/roles";
import { createClient } from "@/lib/supabase/server";
import type { CommuneSettings } from "@/lib/types";
import { normalizeNeighborInviteTemplate } from "@/lib/utils/email-template";

export default async function MairieParametresPage() {
  const ctx = await requireRole([USER_ROLES.municipalityStaff]);
  const communeId = ctx.profile.active_commune_id;
  const supabase = await createClient();

  const [{ data: commune, error: communeError }, { data: template, error: templateError }] =
    await Promise.all([
      communeId
        ? supabase.from("communes").select("settings").eq("id", communeId).single()
        : Promise.resolve({ data: null, error: null }),
      communeId
        ? supabase
            .from("commune_email_templates")
            .select("subject, preheader, body_markdown, cta_label")
            .eq("commune_id", communeId)
            .eq("template_key", NEIGHBOR_INVITE_TEMPLATE_KEY)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

  if (communeError) {
    console.error("Unable to load commune settings page data", communeError.message);
  }
  if (templateError) {
    console.error("Unable to load neighbor invite template", templateError.message);
  }

  const settings = (commune?.settings ?? {}) as CommuneSettings;
  const inviteTemplate = normalizeNeighborInviteTemplate(template);

  return (
    <PageStack>
      <PageHeading
        title="Paramètres communaux"
        subtitle="Ajustez prochainement l'humeur générale : téléphone Mairie public, horaires d'accueil, message d'entête…"
      />

      <Card className="space-y-3 p-6">
        <form action={updateCommuneWelcomeMessage} className="space-y-3">
          <FormField label="Message d'accueil empathique affiché sur le portail Vie Locale communal">
            <Textarea
              name="welcomeMessage"
              rows={4}
              defaultValue={settings.welcomeMessage}
              placeholder="Une phrase humaine avant les procédures…"
            />
          </FormField>
          <FormField label="Horaires d'ouverture">
            <Textarea
              name="openingHours"
              rows={2}
              defaultValue={settings.openingHours}
              placeholder="Lun-Ven …"
            />
          </FormField>
          <FormField label="Téléphone public">
            <Input name="phone" defaultValue={settings.phone} />
          </FormField>
          <FormField label="Adresse administrative">
            <Input name="address" defaultValue={settings.address} />
          </FormField>
          <FormField label="Référent·e">
            <Input name="referentName" defaultValue={settings.referentName} />
          </FormField>
          <FormField label="Fonction">
            <Input name="referentRole" defaultValue={settings.referentRole} />
          </FormField>

          <div className="rounded-2xl border border-border bg-soft-pink p-4">
            <h2 className="text-xl font-semibold leading-7 text-text">
              Mail d&apos;invitation voisin
            </h2>
            <p className="mt-1 text-sm font-medium leading-5 text-muted">
              Utilisez les variables {"{{sender_name}}"}, {"{{commune_name}}"} et{" "}
              {"{{invite_link}}"} pour personnaliser le partage par e-mail.
            </p>
          </div>
          <FormField label="Objet du mail">
            <Input
              name="neighborInviteSubject"
              required
              defaultValue={inviteTemplate.subject}
            />
          </FormField>
          <FormField label="Phrase d'aperçu">
            <Textarea
              name="neighborInvitePreheader"
              rows={2}
              defaultValue={inviteTemplate.preheader}
            />
          </FormField>
          <FormField label="Corps du mail">
            <Textarea
              name="neighborInviteBodyMarkdown"
              required
              rows={8}
              defaultValue={inviteTemplate.bodyMarkdown}
            />
          </FormField>
          <FormField label="Libellé du bouton d'appel à l'action">
            <Input
              name="neighborInviteCtaLabel"
              required
              defaultValue={inviteTemplate.ctaLabel}
            />
          </FormField>
          <GradientButton type="submit" gradient="initiative" className="w-full">
            Enregistrer les informations chaleureuses
          </GradientButton>
        </form>
      </Card>
    </PageStack>
  );
}
