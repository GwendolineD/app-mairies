import Image from "next/image";
import { ILLUSTRATIONS } from "@/lib/constants/illustrations";

export function AuthBackgroundShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const background = ILLUSTRATIONS.auth.background;

  return (
    <div className="relative flex min-h-[calc(100dvh-1px)] flex-1 flex-col bg-warm">
      {background ? (
        <>
          <Image
            src={background}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-background/80" aria-hidden />
        </>
      ) : null}
      <div className="relative flex flex-1 flex-col pb-12 pt-8">{children}</div>
    </div>
  );
}
