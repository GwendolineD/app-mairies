import Image from "next/image";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants/app";
import { ILLUSTRATIONS } from "@/lib/constants/illustrations";
import { ROUTES } from "@/lib/constants/routes";

export function AdminHeader() {
  const logo = ILLUSTRATIONS.resident.header.logoHorizontal;

  return (
    <header className="z-40 w-full shrink-0 bg-surface/95 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-2 md:px-6 lg:px-8">
        <Link
          href={ROUTES.accueil}
          className="flex shrink-0 items-center self-stretch rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-purple/30"
          aria-label={`${APP_NAME} — Accueil`}
        >
          <Image
            src={logo}
            alt={`Logo ${APP_NAME}`}
            width={200}
            height={56}
            priority
            style={{ width: "auto" }}
            className="h-11 max-w-[11rem] object-contain object-left md:h-12 md:max-w-[13rem]"
          />
        </Link>
      </div>
    </header>
  );
}
