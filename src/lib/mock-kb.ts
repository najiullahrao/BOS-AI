import type { StatusBadgeProps } from "@/components/shared/status-badge";

export type KbAccessLevel = "internal" | "public";
export type KbIngestionStatus = "queued" | "processing" | "ready" | "failed";

export interface KbCategory {
  id: string;
  name: string;
  parent_id: string | null;
}

export interface KbDocument {
  id: string;
  title: string;
  category: string;
  access_level: KbAccessLevel;
  version: number;
  ingestion_status: KbIngestionStatus;
  updatedAt: string;
}

export interface KbVersion {
  version: number;
  uploadedBy: string;
  date: string;
  fileSize: string;
}

export interface FieldErrors {
  [field: string]: string | undefined;
}

export const mockKbCategories: KbCategory[] = [
  { id: "cat_1", name: "Policies", parent_id: null },
  { id: "cat_2", name: "HR", parent_id: "cat_1" },
  { id: "cat_3", name: "Leave Policy", parent_id: "cat_2" },
  { id: "cat_4", name: "Product Docs", parent_id: null },
  { id: "cat_5", name: "Support Playbooks", parent_id: null },
];

export const mockKbDocuments: KbDocument[] = [
  { id: "kb_1", title: "Remote Work Policy", category: "HR", access_level: "internal", version: 2, ingestion_status: "ready", updatedAt: "2026-06-20T10:00:00Z" },
  { id: "kb_2", title: "Exporting Large Reports", category: "Support Playbooks", access_level: "public", version: 1, ingestion_status: "ready", updatedAt: "2026-07-01T09:30:00Z" },
  { id: "kb_3", title: "Q3 Pricing Strategy (internal)", category: "Policies", access_level: "internal", version: 3, ingestion_status: "ready", updatedAt: "2026-06-28T14:00:00Z" },
  { id: "kb_4", title: "Getting Started Guide", category: "Product Docs", access_level: "public", version: 1, ingestion_status: "processing", updatedAt: "2026-07-11T09:00:00Z" },
  { id: "kb_5", title: "Scanned Vendor Contract", category: "Policies", access_level: "internal", version: 1, ingestion_status: "failed", updatedAt: "2026-07-10T16:00:00Z" },
];

export const ACCESS_LEVEL_LABELS: Record<KbAccessLevel, string> = {
  internal: "Internal",
  public: "Public",
};

export const INGESTION_LABELS: Record<KbIngestionStatus, string> = {
  queued: "Queued",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
};

export const INGESTION_BADGE_VARIANT: Record<KbIngestionStatus, NonNullable<StatusBadgeProps["variant"]>> = {
  queued: "neutral",
  processing: "warning",
  ready: "success",
  failed: "danger",
};

const versionHistoryByDocId: Record<string, KbVersion[]> = {
  kb_1: [
    { version: 2, uploadedBy: "Diego Ramirez", date: "2026-06-20T10:00:00Z", fileSize: "142 KB" },
    { version: 1, uploadedBy: "Amara Chen", date: "2026-05-02T09:00:00Z", fileSize: "118 KB" },
  ],
};

const parsedContentByDocId: Record<string, string> = {
  kb_1: "This policy covers remote work arrangements for all full-time employees. Employees may request fully remote status with manager approval. The default expectation is hybrid attendance (3 days in-office) unless an exception is formally granted. Requests must be submitted via HR at least 2 weeks in advance.",
  kb_2: "Exporting large report files: exports covering more than 90 days of data may time out during peak load. Split large exports into smaller monthly batches and retry. If the export still fails, contact support and include the date range and approximate batch size.",
  kb_3: "Q3 pricing strategy is internal-only. Pricing tiers and discount thresholds are under review for the upcoming quarter. Do not share this document with customers or external partners until the strategy is announced.",
};

export function getCategoryById(categoryId: string): KbCategory | undefined {
  return mockKbCategories.find((c) => c.id === categoryId);
}

export function getCategoryIdByName(name: string): string | null {
  return mockKbCategories.find((c) => c.name === name)?.id ?? null;
}

export function getCategoryPath(categoryName: string): string {
  const category = mockKbCategories.find((c) => c.name === categoryName);
  if (!category) return categoryName;

  const segments: string[] = [];
  let current: KbCategory | undefined = category;
  while (current) {
    segments.unshift(current.name);
    current = current.parent_id ? getCategoryById(current.parent_id) : undefined;
  }
  return segments.join(" / ");
}

export function getDescendantCategoryIds(categoryId: string): Set<string> {
  const result = new Set<string>([categoryId]);
  const stack = [...mockKbCategories.filter((c) => c.parent_id === categoryId)];
  while (stack.length > 0) {
    const category = stack.pop()!;
    result.add(category.id);
    mockKbCategories.filter((c) => c.parent_id === category.id).forEach((child) => stack.push(child));
  }
  return result;
}

export function getVersionHistory(documentId: string): KbVersion[] {
  if (versionHistoryByDocId[documentId]) return versionHistoryByDocId[documentId];

  const doc = mockKbDocuments.find((d) => d.id === documentId);
  if (!doc) return [];
  return [{ version: doc.version, uploadedBy: "Amara Chen", date: doc.updatedAt, fileSize: `${28 + doc.version * 9} KB` }];
}

export function getParsedContent(documentId: string): string | null {
  return parsedContentByDocId[documentId] ?? null;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockRetryIngestion(documentId: string): Promise<KbDocument> {
  await delay(600);
  const doc = mockKbDocuments.find((d) => d.id === documentId);
  if (!doc) throw new Error(`Document ${documentId} not found`);
  return { ...doc, ingestion_status: "queued" };
}

export interface UploadDocumentInput {
  title: string;
  categoryId: string;
  accessLevel: KbAccessLevel;
  fileName: string;
}

export async function mockUploadDocument(
  input: UploadDocumentInput
): Promise<{ ok: true; document: KbDocument } | { ok: false; errors: FieldErrors }> {
  await delay(600);
  const errors: FieldErrors = {};
  if (!input.title.trim()) errors.title = "Title is required";
  const category = getCategoryById(input.categoryId);
  if (!category) errors.category = "Select a category";
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    document: {
      id: `kb_${Math.random().toString(36).slice(2, 9)}`,
      title: input.title.trim(),
      category: category!.name,
      access_level: input.accessLevel,
      version: 1,
      ingestion_status: "queued",
      updatedAt: new Date().toISOString(),
    },
  };
}
