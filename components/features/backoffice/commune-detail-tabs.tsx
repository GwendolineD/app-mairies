"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";

type Tab = {
  id: string;
  label: string;
};

type Props = {
  tabs: Tab[];
  defaultTab?: string;
  children: Record<string, React.ReactNode>;
};

export function CommuneDetailTabs({ tabs, defaultTab, children }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const fallbackTab = defaultTab ?? tabs[0]?.id ?? "";
  const rawTab = searchParams.get("tab");
  const activeTab = tabs.some((tab) => tab.id === rawTab) ? rawTab! : fallbackTab;

  function setTab(tabId: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (tabId === fallbackTab) {
      params.delete("tab");
    } else {
      params.set("tab", tabId);
    }

    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  return (
    <div className="space-y-4">
      <nav className="flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setTab(tab.id)}
            className={cn(
              "shrink-0 cursor-pointer px-3 py-2 text-sm font-semibold transition",
              activeTab === tab.id
                ? "border-b-2 border-purple text-purple"
                : "text-muted hover:text-text",
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          hidden={activeTab !== tab.id}
          className={activeTab === tab.id ? "block" : "hidden"}
        >
          {children[tab.id]}
        </div>
      ))}
    </div>
  );
}
