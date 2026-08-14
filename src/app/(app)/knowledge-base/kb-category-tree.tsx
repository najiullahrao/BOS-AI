"use client";

import { useMemo } from "react";
import { Files, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { flattenCategoryTree, type FlatTreeCategory } from "@/app/(app)/knowledge-base/kb-tree";

function CategoryRow({
  node,
  selected,
  onSelect,
}: {
  node: FlatTreeCategory;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const Icon = node.isLeaf ? (selected ? FolderOpen : Folder) : selected ? FolderOpen : Folder;
  return (
    <button
      type="button"
      onClick={() => onSelect(node.cat.id)}
      style={{ paddingLeft: `${12 + node.depth * 16}px` }}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
        selected
          ? "bg-primary/10 font-semibold text-primary"
          : "font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950"
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">{node.cat.name}</span>
    </button>
  );
}

export function KbCategoryTree({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const nodes = useMemo(() => flattenCategoryTree(), []);

  return (
    <div className="flex flex-col gap-1 rounded-md border border-border bg-surface p-3 shadow-sm">
      <p className="px-1.5 pb-1 text-xs font-medium text-neutral-600">Categories</p>

      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
          selectedId === null
            ? "bg-primary/10 font-semibold text-primary"
            : "font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950"
        )}
      >
        <Files className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">All documents</span>
      </button>

      {nodes.map((node) => (
        <CategoryRow
          key={node.cat.id}
          node={node}
          selected={selectedId === node.cat.id}
          onSelect={(id) => onSelect(id)}
        />
      ))}
    </div>
  );
}
