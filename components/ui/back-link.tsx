import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Props = {
  href: string;
  children?: React.ReactNode;
  className?: string;
};

export function BackLink({
  href,
  children = "← Retour",
  className,
}: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-purple underline",
        className,
      )}
    >
      <ArrowLeft className="size-3.5 shrink-0" aria-hidden />
      {children}
    </Link>
  );
}
