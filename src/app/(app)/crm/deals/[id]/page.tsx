import Link from "next/link";
import { notFound } from "next/navigation";
import { CrmDetailTemplate, type QuickFact } from "@/components/crm/crm-detail-template";
import { StatusBadge, type StatusBadgeProps } from "@/components/shared/status-badge";
import {
  formatCurrency,
  getCompanyByName,
  getContactForDeal,
  getContactFullName,
  getTimelineForEntity,
  mockDeals,
  PIPELINE_STAGE_LABELS,
  type PipelineStage,
} from "@/lib/mock-crm";

const STAGE_BADGE_STYLE: Record<PipelineStage, { variant: NonNullable<StatusBadgeProps["variant"]>; filled?: boolean }> = {
  qualification: { variant: "info" },
  proposal: { variant: "warning" },
  negotiation: { variant: "warning" },
  closed_won: { variant: "success", filled: true },
  closed_lost: { variant: "danger" },
};

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = mockDeals.find((d) => d.id === id);
  if (!deal) notFound();

  const company = getCompanyByName(deal.company);
  const contact = getContactForDeal(deal);
  const stageStyle = STAGE_BADGE_STYLE[deal.pipeline_stage];
  const amountText = formatCurrency(deal.amount, deal.currency);

  const quickFacts: QuickFact[] = [
    { label: "Stage", value: <StatusBadge variant={stageStyle.variant} filled={stageStyle.filled}>{PIPELINE_STAGE_LABELS[deal.pipeline_stage]}</StatusBadge> },
    { label: "Amount", value: amountText },
    {
      label: "Company",
      value: company ? (
        <Link href={`/crm/companies/${company.id}`} className="truncate text-primary hover:underline" title={deal.company}>
          {deal.company}
        </Link>
      ) : (
        deal.company
      ),
    },
    {
      label: "Contact",
      value: contact ? (
        <Link href={`/crm/contacts/${contact.id}`} className="truncate text-primary hover:underline" title={getContactFullName(contact)}>
          {getContactFullName(contact)}
        </Link>
      ) : (
        "—"
      ),
    },
    { label: "Assigned owner", value: deal.assignedTo },
  ];

  return (
    <CrmDetailTemplate
      entityType="deal"
      title={deal.name}
      metadata={
        <>
          <StatusBadge variant={stageStyle.variant} filled={stageStyle.filled}>
            {PIPELINE_STAGE_LABELS[deal.pipeline_stage]}
          </StatusBadge>
          <span className="truncate" title={amountText}>
            {amountText}
          </span>
        </>
      }
      breadcrumbs={[
        { label: "Home", href: "/dashboard" },
        { label: "CRM", href: "/crm/companies" },
        { label: "Deals", href: "/crm/deals" },
        { label: deal.name },
      ]}
      quickFacts={quickFacts}
      timeline={getTimelineForEntity(deal.id)}
    />
  );
}
