import { cn } from "@/lib/utils/cn";
import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export const formFieldClassName =
  "w-full rounded-sm border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-purple md:py-2";

type FieldProps = {
  className?: string;
};

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & FieldProps) {
  return <input className={cn(formFieldClassName, className)} {...props} />;
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
    <textarea className={cn(formFieldClassName, className)} {...props} />
  );
}

export function FormField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("text-sm font-medium text-text", className)}>
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
