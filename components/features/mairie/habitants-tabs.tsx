"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { key: "habitants", label: "Habitant·es" },
  { key: "invitations", label: "Invitations" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function HabitantsTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabKey) || "habitants";

  const handleTab = (tab: TabKey) => {
    const params = new URLSearchParams();
    if (tab !== "habitants") {
      params.set("tab", tab);
    }
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?");
  };

  return (
    <div className="flex gap-1 border-b border-border">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => handleTab(tab.key)}
          className={cn(
            "cursor-pointer px-4 py-2.5 text-sm font-semibold transition",
            activeTab === tab.key
              ? "border-b-2 border-purple text-purple"
              : "text-muted hover:text-text",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
