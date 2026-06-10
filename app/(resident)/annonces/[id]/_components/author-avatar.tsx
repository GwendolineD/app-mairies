import { cn } from "@/lib/utils/cn";

type Props = {
  name: string | null;
  avatarUrl: string | null;
  className?: string;
};

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Author avatar — photo when available, otherwise gradient circle with initials. */
export function AuthorAvatar({ name, avatarUrl, className }: Props) {
  const base = cn(
    "flex shrink-0 items-center justify-center overflow-hidden rounded-full",
    className,
  );

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className={cn(base, "object-cover")}
      />
    );
  }

  return (
    <span
      className={cn(base, "gradient-hero text-xs font-bold text-white")}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
