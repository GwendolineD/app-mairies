import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import {
  isAnnouncementType,
  type AnnouncementType,
} from "@/lib/constants/announcement-types";
import { buildAnnouncementListQuery } from "@/lib/utils/search-params";

export default async function NouvelleAnnonceRedirectPage(props: {
  searchParams?: Promise<{ type?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const rawType = sp.type ?? "";
  const type: AnnouncementType = isAnnouncementType(rawType) ? rawType : "demande";
  redirect(
    `${ROUTES.annonces.list}${buildAnnouncementListQuery({ create: "annonce", createType: type })}`,
  );
}
