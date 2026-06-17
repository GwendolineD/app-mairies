import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { Input as ShadcnInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea as ShadcnTextarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const formFieldClassName =
  "h-auto w-full rounded-sm border-border bg-surface px-4 py-2.5 text-sm text-text outline-none placeholder:text-subtle focus-visible:border-purple focus-visible:ring-2 focus-visible:ring-purple/20 md:py-2";

type FieldProps = {
  className?: string;
};

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & FieldProps) {
  return (
    <ShadcnInput className={cn(formFieldClassName, className)} {...props} />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & FieldProps) {
  return (
    <select className={cn(formFieldClassName, className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps) {
  return (
    <ShadcnTextarea
      className={cn(formFieldClassName, "min-h-24 field-sizing-content", className)}
      {...props}
    />
  );
}

export function FormField({
  label,
  children,
  className,
  error,
  required,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  name?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="font-medium text-text">
        {label}
        {required && <span className="ml-0.5 text-coral">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs font-medium text-coral">{error}</p>
      )}
    </div>
  );
}
