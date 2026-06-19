import Image from "next/image";
import Link from "next/link";
import { AppNameHighlight } from "@/components/features/auth/app-name-highlight";
import { AuthFeaturesBlock } from "@/components/features/auth/auth-features-block";
import { APP_NAME } from "@/lib/constants/app";
import { ILLUSTRATIONS } from "@/lib/constants/illustrations";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";

type Props = {
  className?: string;
};

export function AuthHeroContent({ className }: Props) {
  const logo = ILLUSTRATIONS.auth.logoHorizontal;

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col px-8 pb-12 pt-5 md:px-10 md:pb-16 md:pt-6",
        className,
      )}
    >
      {logo ? (
        <Link
          href={ROUTES.home}
          className="shrink-0 self-start rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-purple/30 md:ml-12"
          aria-label={`${APP_NAME} — Accueil`}
        >
          <Image
            src={logo}
            alt={`Logo ${APP_NAME}`}
            width={320}
            height={96}
            priority
            style={{ width: "auto" }}
            className="h-16 max-w-[min(100%,16rem)] object-contain object-left md:h-20 md:max-w-[18rem]"
          />
        </Link>
      ) : null}

      <div className="mx-auto max-w-[17rem] space-y-3 pt-4 md:max-w-[18rem] md:pt-5">
        <h1 className="text-[1.75rem] font-bold leading-[1.2] tracking-tight text-text md:text-[2rem] lg:text-[2.125rem]">
          Bienvenue sur <AppNameHighlight>{APP_NAME}</AppNameHighlight>
          {" !"}
        </h1>
      </div>

      <div className="mt-auto pt-8 md:pt-6">
        <AuthFeaturesBlock />
      </div>
    </div>
  );
}
