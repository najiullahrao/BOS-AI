import { mockKbCategories, type KbCategory } from "@/lib/mock-kb";

export interface FlatTreeCategory {
  cat: KbCategory;
  depth: number;
  isLeaf: boolean;
}

export function flattenCategoryTree(): FlatTreeCategory[] {
  const result: FlatTreeCategory[] = [];

  function visit(parentId: string | null, depth: number) {
    mockKbCategories
      .filter((c) => c.parent_id === parentId)
      .forEach((category) => {
        const hasChildren = mockKbCategories.some((c) => c.parent_id === category.id);
        result.push({ cat: category, depth, isLeaf: !hasChildren });
        visit(category.id, depth + 1);
      });
  }

  visit(null, 0);
  return result;
}
