"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn, type DataTableSort } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import {
  ACCESS_LEVEL_LABELS,
  INGESTION_BADGE_VARIANT,
  INGESTION_LABELS,
  getCategoryIdByName,
  getDescendantCategoryIds,
  mockKbDocuments,
  mockRetryIngestion,
  type KbDocument,
} from "@/lib/mock-kb";
import { formatDateTime } from "@/lib/mock-sessions";
import { KbCategoryTree } from "@/app/(app)/knowledge-base/kb-category-tree";
import { KbUploadModal } from "@/app/(app)/knowledge-base/kb-upload-modal";

const CATEGORY_OPTIONS = Array.from(new Set(mockKbDocuments.map((d) => d.category))).map((name) => ({
  label: name,
  value: name,
}));

const ACCESS_OPTIONS = Object.entries(ACCESS_LEVEL_LABELS).map(([value, label]) => ({ label, value }));
const INGESTION_OPTIONS = Object.entries(INGESTION_LABELS).map(([value, label]) => ({ label, value }));

export default function KnowledgeBasePage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<KbDocument[]>(mockKbDocuments);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<DataTableSort>({ key: "updatedAt", direction: "desc" });
  const [uploadOpen, setUploadOpen] = useState(false);

  const filtered = useMemo(() => {
    const categoryIds = selectedCategoryId ? getDescendantCategoryIds(selectedCategoryId) : null;
    const search = (filters.title ?? "").trim().toLowerCase();

    const rows = documents.filter((d) => {
      if (categoryIds && !categoryIds.has(getCategoryIdByName(d.category) ?? "")) return false;
      if (search && !d.title.toLowerCase().includes(search)) return false;
      if (filters.category && d.category !== filters.category) return false;
      if (filters.access_level && d.access_level !== filters.access_level) return false;
      if (filters.ingestion_status && d.ingestion_status !== filters.ingestion_status) return false;
      return true;
    });

    return [...rows].sort((a, b) => {
      const dir = sort.direction === "asc" ? 1 : -1;
      const av = String(a[sort.key as keyof KbDocument] ?? "");
      const bv = String(b[sort.key as keyof KbDocument] ?? "");
      return av > bv ? dir : av < bv ? -dir : 0;
    });
  }, [documents, selectedCategoryId, filters, sort]);

  const hasActiveFilters = Boolean(filters.title || filters.category || filters.access_level || filters.ingestion_status);

  const handleRetry = async (doc: KbDocument) => {
    try {
      const updated = await mockRetryIngestion(doc.id);
      setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      toast.success("Retrying ingestion", { description: `"${doc.title}" re-queued for processing.` });
    } catch {
      toast.error("Retry failed", { description: "Couldn't re-queue the document. Try again." });
    }
  };

  const columns: DataTableColumn<KbDocument>[] = [
    {
      key: "title",
      header: "Title",
      sortable: true,
      filterPlaceholder: "Search documents…",
      accessor: (d) => <span className="font-medium text-neutral-950">{d.title}</span>,
    },
    {
      key: "category",
      header: "Category",
      filterOptions: CATEGORY_OPTIONS,
      accessor: (d) => <span className="text-neutral-600">{d.category}</span>,
    },
    {
      key: "access_level",
      header: "Access Level",
      filterOptions: ACCESS_OPTIONS,
      accessor: (d) =>
        d.access_level === "public" ? (
          <StatusBadge variant="info" filled>
            {ACCESS_LEVEL_LABELS.public}
          </StatusBadge>
        ) : (
          <StatusBadge variant="neutral">{ACCESS_LEVEL_LABELS.internal}</StatusBadge>
        ),
    },
    {
      key: "version",
      header: "Version",
      sortable: true,
      accessor: (d) => <span className="text-neutral-600">v{d.version}</span>,
    },
    {
      key: "updatedAt",
      header: "Last Updated",
      sortable: true,
      accessor: (d) => <span className="text-neutral-600">{formatDateTime(d.updatedAt)}</span>,
    },
    {
      key: "ingestion_status",
      header: "Ingestion Status",
      filterOptions: INGESTION_OPTIONS,
      accessor: (d) => (
        <div className="flex items-center gap-2">
          <StatusBadge
            variant={INGESTION_BADGE_VARIANT[d.ingestion_status]}
            className={d.ingestion_status === "processing" ? "animate-pulse" : undefined}
          >
            {INGESTION_LABELS[d.ingestion_status]}
          </StatusBadge>
          {d.ingestion_status === "failed" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleRetry(d);
              }}
            >
              <RefreshCw className="size-3" aria-hidden="true" />
              Retry
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Knowledge Base"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Knowledge Base" }]}
        primaryAction={{ label: "Upload document", icon: Upload, onClick: () => setUploadOpen(true) }}
      />

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <KbCategoryTree selectedId={selectedCategoryId} onSelect={setSelectedCategoryId} />

        <DataTable
          columns={columns}
          data={filtered}
          getRowId={(d) => d.id}
          onRowClick={(d) => router.push(`/knowledge-base/${d.id}`)}
          sort={sort}
          onSortChange={(key) =>
            setSort((prev) => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }))
          }
          filters={filters}
          onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
          hasMore={false}
          emptyState={
            hasActiveFilters ? (
              <EmptyState
                variant="filtered"
                message="No documents match your search"
                ctaLabel="Clear search"
                onCtaClick={() => setFilters({})}
              />
            ) : (
              <EmptyState
                variant="first-time"
                message="No documents in this category yet — upload your first policy, guide, or reference doc."
                ctaLabel="Upload document"
                onCtaClick={() => setUploadOpen(true)}
              />
            )
          }
        />
      </div>

      <KbUploadModal open={uploadOpen} onOpenChange={setUploadOpen} onUploaded={(doc) => setDocuments((prev) => [doc, ...prev])} />
    </div>
  );
}
