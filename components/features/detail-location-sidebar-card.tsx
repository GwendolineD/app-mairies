import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

type Props = {
  className?: string;
  children: React.ReactNode;
};

export function DetailLocationSidebarCard({ className, children }: Props) {
  return (
    <Card className={cn("gap-4 md:gap-2 md:p-5", className)}>
      <h2 className="flex items-center gap-2 text-lg font-semibold text-text md:text-base md:leading-6">
        <MapPin className="size-5 shrink-0 text-orange" aria-hidden />
        Localisation
      </h2>
      {children}
    </Card>
  );
}
