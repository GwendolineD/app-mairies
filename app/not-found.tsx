import type { Metadata } from "next";
import { NotFoundPage } from "@/components/features/not-found-page";

export const metadata: Metadata = {
  title: "Page introuvable",
};

export default function NotFound() {
  return <NotFoundPage />;
}
