import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";

export default function Loading() {
  return (
    <PageStack gap="4">
      <PageHeading
        title="Notifications"
        subtitle="Ce qui bouge autour de vous et de vos contenus."
      />
      <div className="flex flex-col gap-6" aria-busy="true">
        <section>
          <div className="mb-2 h-3 w-24 animate-pulse rounded-sm bg-warm" />
          <Card className="overflow-hidden p-0">
            <ul className="divide-y divide-border/40">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="flex items-start gap-3 px-4 py-3">
                  <span className="size-10 shrink-0 animate-pulse rounded-full bg-warm" />
                  <span className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
                    <span className="h-3.5 w-2/3 animate-pulse rounded-sm bg-warm" />
                    <span className="h-3 w-1/2 animate-pulse rounded-sm bg-warm" />
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>
    </PageStack>
  );
}
