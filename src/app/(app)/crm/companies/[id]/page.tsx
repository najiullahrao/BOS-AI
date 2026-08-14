import { notFound } from "next/navigation";
import { CrmDetailTemplate, type LinkedContactSummary, type LinkedDealSummary, type QuickFact } from "@/components/crm/crm-detail-template";
import {
  formatFullDate,
  getContactFullName,
  getContactsForCompany,
  getDealsForCompany,
  getTimelineForEntity,
  mockCompanies,
} from "@/lib/mock-crm";

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = mockCompanies.find((c) => c.id === id);
  if (!company) notFound();

  const linkedContacts: LinkedContactSummary[] = getContactsForCompany(company.name).map((contact) => ({
    id: contact.id,
    name: getContactFullName(contact),
    title: contact.title,
  }));

  const linkedDeals: LinkedDealSummary[] = getDealsForCompany(company.name).map((deal) => ({
    id: deal.id,
    name: deal.name,
    stage: deal.pipeline_stage,
    amount: deal.amount,
    currency: deal.currency,
  }));

  const quickFacts: QuickFact[] = [
    { label: "Domain", value: company.domain },
    { label: "Industry", value: company.industry },
    { label: "Size range", value: company.size_range },
    { label: "Assigned owner", value: company.assignedTo },
    { label: "Created", value: formatFullDate(company.createdAt) },
  ];

  const metadataText = `${company.industry} · ${company.size_range} employees`;

  return (
    <CrmDetailTemplate
      entityType="company"
      title={company.name}
      metadata={
        <span className="truncate" title={metadataText}>
          {metadataText}
        </span>
      }
      breadcrumbs={[
        { label: "Home", href: "/dashboard" },
        { label: "CRM", href: "/crm/companies" },
        { label: "Companies", href: "/crm/companies" },
        { label: company.name },
      ]}
      avatarInitials={company.name.charAt(0).toUpperCase()}
      quickFacts={quickFacts}
      timeline={getTimelineForEntity(company.id)}
      linkedContacts={linkedContacts}
      linkedDeals={linkedDeals}
    />
  );
}
