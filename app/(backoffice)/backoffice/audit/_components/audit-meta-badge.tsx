import {
  AUDIT_CATEGORY_LABELS,
  AUDIT_CATEGORY_STYLES,
  AUDIT_SEVERITY_LABELS,
  AUDIT_SEVERITY_STYLES,
  type AuditCategoryValue,
  type AuditSeverityValue,
} from "@/lib/constants/audit";
import { cn } from "@/lib/utils/cn";

type AuditMetaBadgeProps = {
  kind: "category" | "severity";
  value: AuditCategoryValue | AuditSeverityValue;
  size?: "sm" | "md";
  className?: string;
};

export function AuditMetaBadge({
  kind,
  value,
  size = "md",
  className,
}: AuditMetaBadgeProps) {
  const styles =
    kind === "category"
      ? AUDIT_CATEGORY_STYLES[value as AuditCategoryValue]
      : AUDIT_SEVERITY_STYLES[value as AuditSeverityValue];
  const label =
    kind === "category"
      ? AUDIT_CATEGORY_LABELS[value as AuditCategoryValue]
      : AUDIT_SEVERITY_LABELS[value as AuditSeverityValue];

  return (
    <span
      className={cn(
        "inline-flex rounded-full font-bold uppercase",
        size === "sm"
          ? "px-2 py-0.5 text-[10px] leading-none"
          : "px-2.5 py-0.5 text-[10px] leading-none",
        styles,
        className,
      )}
    >
      {label}
    </span>
  );
}
