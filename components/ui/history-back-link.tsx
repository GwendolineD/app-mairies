"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { resolveInAppBackTarget, buildInAppHref } from "@/lib/navigation/in-app-history";
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
    const search =
      typeof window !== "undefined" ? window.location.search.slice(1) : "";
    const currentHref = buildInAppHref(pathname, search || undefined);
    router.push(resolveInAppBackTarget(currentHref, fallbackHref));
  }

  return (
    <div
      className={cn(
        "sticky top-0 z-10 -mx-5 -mt-4 flex min-h-11 items-center bg-surface px-5 py-3 md:-mx-6 md:-mt-6 md:px-6 lg:-mx-8 lg:px-8",
        className,
      )}
    >
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-purple underline"
      >
        <ArrowLeft className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
        {label}
      </button>
    </div>
  );
}
