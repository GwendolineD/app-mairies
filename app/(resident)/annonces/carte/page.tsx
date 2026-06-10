import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { buildAnnouncementListQuery } from "@/lib/utils/search-params";

export default async function AnnoncesCarteRedirectPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await props.searchParams) ?? {};
  const categorie = Array.isArray(sp.categorie) ? sp.categorie[0] : sp.categorie;
  const type = Array.isArray(sp.type) ? sp.type[0] : sp.type;

  redirect(
    `${ROUTES.annonces.list}${buildAnnouncementListQuery({
      vue: "carte",
      categorie: categorie || undefined,
      type: type === "demande" || type === "offre" ? type : undefined,
    })}`,
  );
}
