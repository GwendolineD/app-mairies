import { cn } from "@/lib/utils/cn";

type Props = {
  title: string;
  subtitle?: string;
  /** hero = landing/marketing H1 ; screen = titres d'écran mobile */
  size?: "hero" | "screen";
  centered?: boolean;
  className?: string;
};

export function PageHeading({
  title,
  subtitle,
  size = "screen",
  centered = false,
  className,
}: Props) {
  return (
    <header className={cn(centered && "text-center", className)}>
      <h1
        className={cn(
          "text-text",
          size === "hero"
            ? "text-balance text-5xl font-bold leading-[56px]"
            : "text-[28px] font-bold leading-9",
        )}
      >
        {title}
      </h1>
      {subtitle ? (
        <p
          className={cn(
            "mt-2 text-sm font-medium leading-5 text-muted",
            centered && "text-pretty",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
