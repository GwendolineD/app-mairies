import Image from "next/image";
import { APP_NAME } from "@/lib/constants/app";
import { ILLUSTRATIONS } from "@/lib/constants/illustrations";
import { cn } from "@/lib/utils/cn";

type Props = {
  className?: string;
};

export function LegalDocumentLogo({ className }: Props) {
  const logo = ILLUSTRATIONS.auth.logoHorizontal;

  return (
    <div
      className={cn(
        "legal-document-logo flex justify-center pb-6 print:pb-4",
        className,
      )}
    >
      <Image
        src={logo}
        alt={`Logo ${APP_NAME}`}
        width={240}
        height={68}
        priority
        className="h-14 w-auto max-w-[15rem] object-contain md:h-16 md:max-w-[17rem]"
      />
    </div>
  );
}
