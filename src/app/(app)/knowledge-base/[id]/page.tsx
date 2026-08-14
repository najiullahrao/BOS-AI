import { notFound } from "next/navigation";
import { KbDetailClient } from "@/app/(app)/knowledge-base/[id]/kb-detail-client";
import { getParsedContent, getVersionHistory, mockKbDocuments } from "@/lib/mock-kb";

export default async function KbDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = mockKbDocuments.find((d) => d.id === id);
  if (!document) notFound();

  return (
    <KbDetailClient
      document={document}
      initialVersions={getVersionHistory(document.id)}
      initialContent={getParsedContent(document.id)}
    />
  );
}
