import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { buildInitiativeListQuery } from "@/lib/utils/search-params";

export default function NouvelleInitiativeRedirectPage() {
  redirect(
    `${ROUTES.initiatives.list}${buildInitiativeListQuery({ create: "initiative" })}`,
  );
}
