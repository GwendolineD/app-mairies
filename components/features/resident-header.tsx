import Image from "next/image";
import Link from "next/link";
import { CommuneSwitcher } from "@/components/features/commune-switcher";
import { ResidentMobileHeaderMenu } from "@/components/features/resident-mobile-header-menu";
import { ResidentUserMenu } from "@/components/features/resident-user-menu";
import type { BackofficeNavLink } from "@/lib/auth/permissions";
import { APP_NAME } from "@/lib/constants/app";
import { ILLUSTRATIONS } from "@/lib/constants/illustrations";
import { ROUTES } from "@/lib/constants/routes";
import type { Membership, Profile } from "@/lib/types";

type Props = {
  profile: Profile;
  memberships: Membership[];
  activeCommuneId: string | null | undefined;
  backofficeLinks?: BackofficeNavLink[];
};

export function ResidentHeader({
  profile,
  memberships,
  activeCommuneId,
  backofficeLinks = [],
}: Props) {
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

        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <div className="md:hidden">
            <ResidentMobileHeaderMenu
              profile={profile}
              memberships={memberships}
              activeCommuneId={activeCommuneId}
              backofficeLinks={backofficeLinks}
            />
          </div>
          <div className="hidden items-center gap-2 md:flex md:gap-3">
            <CommuneSwitcher
              memberships={memberships}
              activeCommuneId={activeCommuneId}
            />
            <ResidentUserMenu
              profile={profile}
              backofficeLinks={backofficeLinks}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
