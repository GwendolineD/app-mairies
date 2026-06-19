import Image from "next/image";
import { AppNameHighlight } from "@/components/features/auth/app-name-highlight";
import { AuthFeaturesBlock } from "@/components/features/auth/auth-features-block";
import { APP_NAME } from "@/lib/constants/app";
import { ILLUSTRATIONS } from "@/lib/constants/illustrations";
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
        <Image
          src={logo}
          alt={`Logo ${APP_NAME}`}
          width={320}
          height={96}
          priority
          style={{ width: "auto" }}
          className="h-20 max-w-[min(100%,20rem)] shrink-0 object-contain object-left md:ml-12 md:h-24 md:max-w-[22rem]"
        />
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
