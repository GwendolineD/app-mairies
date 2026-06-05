import { Sparkles } from "lucide-react";
import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type Props = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function ProfileEmptyState({ title, description, action }: Props) {
  return (
    <Card className="flex flex-col items-center gap-4 p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-soft-pink text-purple">
        <Sparkles className="size-6" aria-hidden />
      </div>
      <div>
        <h3 className="text-xl font-semibold leading-7 text-text">{title}</h3>
        <p className="mt-2 max-w-md text-sm font-medium leading-5 text-muted">
          {description}
        </p>
      </div>
      {action}
    </Card>
  );
}
