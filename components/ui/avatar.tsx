import Image from "next/image";
import { buildOptimizedCloudinaryUrl } from "@/lib/services/cloudinary";
import { cn } from "@/lib/utils/cn";
import { participantInitials } from "@/lib/utils/names";
import type { ParticipantProfile } from "@/lib/types";

type Size = "sm" | "md" | "lg";

const sizeClass: Record<Size, string> = {
  sm: "size-9 text-xs",
  md: "size-11 text-sm",
  lg: "size-14 text-base",
};

const sizePx: Record<Size, number> = {
  sm: 36,
  md: 44,
  lg: 56,
};

type Props = {
  profile: ParticipantProfile | null;
  size?: Size;
  className?: string;
};

/** Round avatar — shows the photo when available, gradient initials otherwise.. */
export function Avatar({ profile, size = "md", className }: Props) {
  if (profile?.avatar_url) {
    return (
      <Image
        src={buildOptimizedCloudinaryUrl(profile.avatar_url, { width: 160 })}
        alt=""
        width={sizePx[size]}
        height={sizePx[size]}
        className={cn(
          "shrink-0 rounded-full border border-border/60 object-cover",
          sizeClass[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold leading-none text-white gradient-hero",
        sizeClass[size],
        className,
      )}
      aria-hidden
    >
      {participantInitials(profile)}
    </span>
  );
}
