"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { resolveInAppBackTarget } from "@/lib/navigation/in-app-history";
import { cn } from "@/lib/utils/cn";

type Props = {
  label?: string;
  className?: string;
  /** Used when there is no prior in-app page in our navigation stack. */
  fallbackHref?: string;
};

export function HistoryBackLink({
  label = "Retour",
  className,
  fallbackHref = ROUTES.accueil,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function handleBack() {
    router.push(resolveInAppBackTarget(pathname, fallbackHref));
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-purple underline",
        className,
      )}
    >
      <ArrowLeft className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
      {label}
    </button>
  );
}
