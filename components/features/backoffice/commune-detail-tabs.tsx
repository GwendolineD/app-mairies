"use client";

import { useState } from "react";
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
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? "");

  return (
    <div className="space-y-4">
      <nav className="flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
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
