"use client";

import { useState } from "react";
import { FileWarning, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DetailLayout, type DetailTab } from "@/components/shared/detail-layout";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/shared/toast";
import {
  ACCESS_LEVEL_LABELS,
  getCategoryPath,
  INGESTION_LABELS,
  mockRetryIngestion,
  type KbDocument,
  type KbVersion,
} from "@/lib/mock-kb";
import { formatFullDate } from "@/lib/mock-crm";

function ContentView({
  status,
  content,
  onRetry,
}: {
  status: KbDocument["ingestion_status"];
  content: string | null;
  onRetry: () => void;
}) {
  if (status === "queued") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-neutral-200 px-6 py-16 text-center">
        <span className="size-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" aria-hidden="true" />
        <p className="text-sm text-neutral-950">Queued — this document is not searchable yet.</p>
      </div>
    );
  }

  if (status === "processing") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-neutral-200 px-6 py-16 text-center">
        <span className="size-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" aria-hidden="true" />
        <p className="text-sm text-neutral-950">Processing… this document is not searchable yet</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-danger/30 bg-danger/5 px-6 py-16 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-danger/10 text-danger">
          <FileWarning className="size-5" aria-hidden="true" />
        </div>
        <p className="max-w-sm text-sm text-neutral-950">
          We couldn&apos;t parse this document. It was likely a low-quality scan or an unsupported layout.
        </p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Retry
        </Button>
      </div>
    );
  }

  if (!content) {
    return (
      <p className="text-sm text-neutral-950">No content available for this document yet.</p>
    );
  }

  return (
    <div className="max-w-3xl rounded-md border border-border bg-surface p-5">
      <p className="whitespace-pre-wrap text-sm leading-7 text-neutral-950">{content}</p>
    </div>
  );
}

function VersionHistoryTable({ versions }: { versions: KbVersion[] }) {
  const columns: DataTableColumn<KbVersion>[] = [
    { key: "version", header: "Version", accessor: (v) => <span className="font-medium text-neutral-950">v{v.version}</span> },
    { key: "uploadedBy", header: "Uploaded by", accessor: (v) => <span className="text-neutral-600">{v.uploadedBy}</span> },
    { key: "date", header: "Date", accessor: (v) => <span className="text-neutral-600">{formatFullDate(v.date)}</span> },
    { key: "fileSize", header: "File size", accessor: (v) => <span className="text-neutral-600">{v.fileSize}</span> },
  ];

  return (
    <div className="max-w-3xl">
      <DataTable columns={columns} data={versions} getRowId={(v) => `v${v.version}`} hasMore={false} />
    </div>
  );
}

export function KbDetailClient({
  document: initialDocument,
  initialVersions,
  initialContent,
}: {
  document: KbDocument;
  initialVersions: KbVersion[];
  initialContent: string | null;
}) {
  const [document, setDocument] = useState(initialDocument);
  const [content] = useState(initialContent);

  async function handleRetry() {
    try {
      const updated = await mockRetryIngestion(document.id);
      setDocument(updated);
      toast.success("Retrying ingestion", { description: `"${document.title}" re-queued for processing.` });
    } catch {
      toast.error("Retry failed", { description: "Couldn't re-queue the document. Try again." });
    }
  }

  const tabs: DetailTab[] = [
    {
      value: "content",
      label: "Content",
      content: <ContentView status={document.ingestion_status} content={content} onRetry={handleRetry} />,
    },
    { value: "versions", label: "Version History", content: <VersionHistoryTable versions={initialVersions} /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={document.title}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Knowledge Base", href: "/knowledge-base" },
          { label: document.title },
        ]}
      />

      <DetailLayout
        header={
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-semibold text-neutral-950" title={document.title}>
                {document.title}
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                {getCategoryPath(document.category)} · v{document.version} ·{" "}
                {document.access_level === "public" ? (
                  <StatusBadge variant="info" filled className="ml-1 align-middle">
                    {ACCESS_LEVEL_LABELS.public}
                  </StatusBadge>
                ) : (
                  <StatusBadge variant="neutral" className="ml-1 align-middle">
                    {ACCESS_LEVEL_LABELS.internal}
                  </StatusBadge>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge variant={document.ingestion_status === "ready" ? "success" : document.ingestion_status === "failed" ? "danger" : "warning"}>
                {INGESTION_LABELS[document.ingestion_status]}
              </StatusBadge>
            </div>
          </div>
        }
        tabs={tabs}
      />
    </div>
  );
}
