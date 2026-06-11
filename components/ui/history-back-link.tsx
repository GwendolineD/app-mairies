"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

type Props = {
  label?: string;
  className?: string;
};

export function HistoryBackLink({ label = "retour", className }: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
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
