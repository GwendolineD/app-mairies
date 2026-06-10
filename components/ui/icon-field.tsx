import type { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type IconFieldProps = {
  label: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
};

export function IconField({
  label,
  icon: Icon,
  children,
  className,
}: IconFieldProps) {
  return (
    <div className={cn("w-full", className)}>
      <Label className="mb-1.5 block text-xs font-semibold text-text">{label}</Label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-[18px] -translate-y-1/2 text-subtle"
          aria-hidden
        />
        {children}
      </div>
    </div>
  );
}

export function IconInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Input className={cn("pl-10 placeholder:text-subtle", className)} {...props} />
  );
}
