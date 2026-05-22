type Props = {
  description: string;
  aspectRatio?: string;
  className?: string;
};

/** ASSET: Replace with designed illustration or icon when provided. */
export function AssetPlaceholder({
  description,
  aspectRatio = "16/9",
  className = "",
}: Props) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl border-2 border-dashed border-border bg-warm p-4 text-center text-xs text-muted ${className}`}
      style={{ aspectRatio }}
      aria-hidden
    >
      {description}
    </div>
  );
}
