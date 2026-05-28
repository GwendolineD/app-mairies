import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";

export default function InscriptionCommuneRedirect() {
  redirect(ROUTES.inscription.root);
}
