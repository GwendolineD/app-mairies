import { cn } from "@/lib/utils/cn";

type Props = {
  name: string;
  url: string | null;
  size?: "sm" | "md";
  className?: string;
};

const SIZE_CLASSES = {
  sm: "size-8",
  md: "size-10",
} as const;

export function UserAvatar({ name, url, size = "md", className }: Props) {
  const sizeClass = SIZE_CLASSES[size];

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className={cn(
          "shrink-0 rounded-full border border-border object-cover",
          sizeClass,
          className,
        )}
      />
    );
  }

  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-soft-pink font-bold text-purple",
        sizeClass,
        size === "sm" ? "text-xs" : "text-sm",
        className,
      )}
    >
      {initials || "?"}
    </div>
  );
}
