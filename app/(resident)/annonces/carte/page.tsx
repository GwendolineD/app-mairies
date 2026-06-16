import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import {
  buildAnnouncementListQuery,
  parseAnnouncementListParams,
} from "@/lib/utils/search-params";

export default async function AnnoncesCarteRedirectPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await props.searchParams) ?? {};
  const parsed = parseAnnouncementListParams(sp);

  redirect(
    `${ROUTES.annonces.list}${buildAnnouncementListQuery({
      ...parsed,
      vue: "carte",
    })}`,
  );
}
