import { cn } from "@/lib/utils/cn";

type Props = {
  title: string;
  subtitle?: string;
  /** hero = landing/marketing H1 ; screen = titres d'écran mobile */
  size?: "hero" | "screen";
  centered?: boolean;
  className?: string;
  actions?: React.ReactNode;
};

export function PageHeading({
  title,
  subtitle,
  size = "screen",
  centered = false,
  className,
  actions,
}: Props) {
  return (
    <header
      className={cn(
        actions && "flex items-start justify-between gap-3",
        centered && !actions && "text-center",
        className,
      )}
    >
      <div className={cn("min-w-0 flex-1", centered && "text-center")}>
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
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
