import Link from "next/link";
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
        "text-xs font-semibold text-purple underline",
        className,
      )}
    >
      {children}
    </Link>
  );
}
