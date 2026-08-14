"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const CRM_TABS = [
  { label: "Companies", href: "/crm/companies" },
  { label: "Contacts", href: "/crm/contacts" },
  { label: "Leads", href: "/crm/leads" },
  { label: "Deals", href: "/crm/deals" },
];

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex gap-1 border-b border-border">
        {CRM_TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
                active
                  ? "border-primary font-semibold text-primary"
                  : "border-transparent font-medium text-neutral-600 hover:text-neutral-950"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
