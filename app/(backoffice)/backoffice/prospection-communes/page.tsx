import { createClient } from "@/lib/supabase/server";
import { AddProspectCommuneButton } from "@/components/features/backoffice/add-prospect-commune-button";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { parseProspectCommunesParams } from "@/lib/prospect-communes/filter-params";
import {
  countProspectCommunes,
  countWithoutCoordinates,
  getProspectCommuneById,
  listProspectCommunes,
} from "@/lib/queries/backoffice-prospect-communes";
import { ProspectionView } from "./_components/prospection-view";

export const dynamic = "force-dynamic";

export default async function BackofficeProspectionCommunesPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const params = parseProspectCommunesParams(searchParams);
  const supabase = await createClient();

  const [listResult, totalCount, detail] = await Promise.all([
    listProspectCommunes(supabase, params),
    countProspectCommunes(supabase, params),
    params.detailId
      ? getProspectCommuneById(supabase, params.detailId)
      : Promise.resolve(null),
  ]);

  const withoutCoordinatesCount = countWithoutCoordinates(listResult.items);

  return (
    <PageStack
      className={params.view === "map" ? "min-h-0 flex-1 md:overflow-hidden" : undefined}
    >
      <PageHeading
        className="shrink-0"
        title="Prospection communes"
        subtitle="Cartographie et filtres des communes cibles — données importées depuis le fichier de prospection territorial."
        actions={<AddProspectCommuneButton />}
      />
      <ProspectionView
        params={params}
        items={listResult.items}
        totalCount={totalCount}
        truncated={listResult.truncated}
        withoutCoordinatesCount={withoutCoordinatesCount}
        detail={detail}
      />
    </PageStack>
  );
}
