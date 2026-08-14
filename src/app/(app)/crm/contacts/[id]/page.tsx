import { notFound } from "next/navigation";
import { CrmDetailTemplate, type LinkedDealSummary, type QuickFact } from "@/components/crm/crm-detail-template";
import { getUserInitials } from "@/lib/mock-data";
import {
  formatFullDate,
  getContactFullName,
  getDealsForCompany,
  getTimelineForEntity,
  mockContacts,
  SOURCE_LABELS,
} from "@/lib/mock-crm";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contact = mockContacts.find((c) => c.id === id);
  if (!contact) notFound();

  const fullName = getContactFullName(contact);

  const linkedDeals: LinkedDealSummary[] = getDealsForCompany(contact.company).map((deal) => ({
    id: deal.id,
    name: deal.name,
    stage: deal.pipeline_stage,
    amount: deal.amount,
    currency: deal.currency,
  }));

  const quickFacts: QuickFact[] = [
    { label: "Email", value: contact.email },
    { label: "Phone", value: contact.phone ?? "—" },
    { label: "Source", value: SOURCE_LABELS[contact.source] },
    { label: "Assigned owner", value: contact.assignedTo },
    { label: "Created", value: formatFullDate(contact.createdAt) },
  ];

  const metadataText = `${contact.title} @ ${contact.company}`;

  return (
    <CrmDetailTemplate
      entityType="contact"
      title={fullName}
      metadata={
        <span className="truncate" title={metadataText}>
          {metadataText}
        </span>
      }
      breadcrumbs={[
        { label: "Home", href: "/dashboard" },
        { label: "CRM", href: "/crm/companies" },
        { label: "Contacts", href: "/crm/contacts" },
        { label: fullName },
      ]}
      avatarInitials={getUserInitials(fullName)}
      quickFacts={quickFacts}
      timeline={getTimelineForEntity(contact.id)}
      linkedDeals={linkedDeals}
    />
  );
}
