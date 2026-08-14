"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface DetailTab {
  value: string;
  label: string;
  content: React.ReactNode;
}

export interface DetailLayoutProps {
  /** Header block: title, metadata, status badges, actions — fully custom. */
  header: React.ReactNode;
  tabs: DetailTab[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (value: string) => void;
  /** Optional right-hand sidebar, e.g. activity feed or metadata panel. */
  sidebar?: React.ReactNode;
  className?: string;
}

export function DetailLayout({
  header,
  tabs,
  defaultTab,
  activeTab,
  onTabChange,
  sidebar,
  className,
}: DetailLayoutProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="border-b border-border pb-6">{header}</div>

      <div className={cn("grid grid-cols-1 gap-6", sidebar && "lg:grid-cols-[1fr_320px]")}>
        <Tabs
          defaultValue={defaultTab ?? tabs[0]?.value}
          value={activeTab}
          onValueChange={onTabChange}
          className="min-w-0"
        >
          <TabsList variant="line" className="mb-4 w-full justify-start border-b border-border">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>

        {sidebar && <aside className="flex flex-col gap-4">{sidebar}</aside>}
      </div>
    </div>
  );
}
