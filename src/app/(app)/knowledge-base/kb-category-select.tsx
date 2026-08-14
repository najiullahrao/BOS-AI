"use client";

import { useState } from "react";
import { ChevronsUpDown, Folder, FolderOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getCategoryById, getCategoryPath } from "@/lib/mock-kb";
import { flattenCategoryTree, type FlatTreeCategory } from "@/app/(app)/knowledge-base/kb-tree";

export function KbCategorySelect({
  value,
  onChange,
  invalid,
}: {
  value: string;
  onChange: (categoryId: string) => void;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = value ? getCategoryById(value) : undefined;
  const nodes = flattenCategoryTree();
  const filtered = query.trim()
    ? nodes.filter((node) => node.cat.name.toLowerCase().includes(query.trim().toLowerCase()))
    : nodes;

  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className={cn(
          "flex h-8 w-full items-center justify-between gap-1.5 rounded-md border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          invalid && "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
        )}
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected ? getCategoryPath(selected.name) : "Select a category"}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-9 z-10 flex flex-col overflow-hidden rounded-md border border-border bg-surface shadow-md">
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search categories…"
                className="h-7 pl-7 text-xs"
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">No categories found</p>}
            {filtered.map((node: FlatTreeCategory) => {
              const Icon = node.isLeaf ? Folder : FolderOpen;
              const isSelected = node.cat.id === value;
              return (
                <button
                  key={node.cat.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(node.cat.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  style={{ paddingLeft: `${12 + node.depth * 14}px` }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm transition-colors",
                    isSelected ? "bg-primary/10 font-medium text-primary" : "text-neutral-950 hover:bg-neutral-50"
                  )}
                >
                  <Icon className="size-3.5 shrink-0 text-neutral-600" aria-hidden="true" />
                  <span className="truncate">{node.cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
