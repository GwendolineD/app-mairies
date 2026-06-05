import { createAnnouncement } from "@/lib/actions/announcements";
import {
  ANNOUNCEMENT_TYPES,
  type AnnouncementType,
} from "@/lib/constants/announcement-types";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/constants/announcement-categories";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select, Textarea } from "@/components/ui/form-field";

type Props = {
  presetType?: AnnouncementType;
  redirectTo?: string;
  submitLabel?: string;
  compact?: boolean;
};

export function AnnouncementForm({
  presetType = "demande",
  redirectTo,
  submitLabel = "Publier mon annonce bienveillante",
  compact = false,
}: Props) {
  return (
    <form action={createAnnouncement} className="flex flex-col gap-3">
      {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}
      <FormField label="Type">
        <Select name="type" defaultValue={presetType}>
          {ANNOUNCEMENT_TYPES.map((type) => (
            <option key={type.slug} value={type.slug}>
              {type.label}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Catégorie">
        <Select name="categorySlug">
          {ANNOUNCEMENT_CATEGORIES.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.label}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Titre">
        <Input
          name="title"
          required
          minLength={3}
          placeholder="Court et chaleureux"
        />
      </FormField>

      <FormField label="Description (optionnel)">
        <Textarea
          name="description"
          rows={compact ? 3 : 5}
          placeholder="Horaires, durée estimée, contexte utile..."
        />
      </FormField>

      <FormField label="Date souhaitée (optionnel)">
        <Input name="targetDate" type="date" />
      </FormField>

      <FormField label="Photo principale · URL accessible (optionnel)">
        <Input type="url" name="photoUrl" placeholder="https://" />
      </FormField>

      <Button type="submit" className="mt-2 w-full py-3">
        {submitLabel}
      </Button>
    </form>
  );
}
