import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthHeroContent } from "@/components/features/auth/auth-hero-content";
import { APP_NAME } from "@/lib/constants/app";
import { ILLUSTRATIONS } from "@/lib/constants/illustrations";
import { ROUTES } from "@/lib/constants/routes";

type Props = {
  children: React.ReactNode;
};

export function AuthPageShell({ children }: Props) {
  const logo = ILLUSTRATIONS.auth.logoHorizontal;
  const background = ILLUSTRATIONS.auth.background;

  return (
    <div className="relative min-h-dvh md:h-dvh md:overflow-hidden">
      {background ? (
        <Image
          src={background}
          alt=""
          fill
          priority
          sizes="100vw"
          className="hidden object-cover object-[center_42%] md:block"
        />
      ) : null}

      <div className="relative flex min-h-dvh flex-col md:h-full md:flex-row md:overflow-hidden">
        <aside className="hidden min-h-0 md:flex md:w-[46%] md:shrink-0 md:flex-col md:overflow-hidden">
          <AuthHeroContent className="flex-1" />
        </aside>

        <div className="flex min-h-dvh flex-1 flex-col bg-surface md:h-full md:w-[54%] md:overflow-hidden md:bg-transparent">
          <header className="relative flex h-14 shrink-0 items-center px-4 md:hidden">
            <Link
              href={ROUTES.home}
              className="absolute left-2 flex size-10 cursor-pointer items-center justify-center text-text"
              aria-label="Retour"
            >
              <ArrowLeft className="size-5" strokeWidth={2.25} />
            </Link>
            {logo ? (
              <Image
                src={logo}
                alt={`Logo ${APP_NAME}`}
                width={168}
                height={48}
                priority
                style={{ width: "auto" }}
                className="mx-auto h-12 object-contain"
              />
            ) : null}
          </header>

          <div className="flex-1 overflow-y-auto px-6 pt-10 pb-12 md:flex md:w-full md:min-h-0 md:flex-col md:justify-start md:overflow-hidden md:px-10 md:pt-16 md:pb-16 lg:px-14">
            <div className="mx-auto flex min-h-0 w-full max-w-[400px] flex-1 flex-col md:max-w-none">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
