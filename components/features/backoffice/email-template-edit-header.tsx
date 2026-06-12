import { PageHeading } from "@/components/ui/page-heading";

type Props = {
  slug: string;
  description: string | null;
};

export function EmailTemplateEditHeader({ slug, description }: Props) {
  return (
    <PageHeading
      title={`Template : ${slug}`}
      subtitle={description ?? undefined}
    />
  );
}
