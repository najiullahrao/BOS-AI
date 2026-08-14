"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Ticket as TicketIcon } from "lucide-react";
import { PageHeader, type Breadcrumb } from "@/components/shared/page-header";
import { DetailLayout, type DetailTab } from "@/components/shared/detail-layout";
import { StatusBadge, type StatusBadgeProps } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "@/components/shared/toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUserInitials, mockSession } from "@/lib/mock-data";
import {
  formatCurrency,
  formatRelativeTime,
  MOCK_NOW,
  PIPELINE_STAGE_LABELS,
  type PipelineStage,
  type TimelineEntry,
} from "@/lib/mock-crm";

export type CrmEntityType = "contact" | "company" | "deal";

export interface QuickFact {
  label: string;
  value: React.ReactNode;
  /** Full text for the title-attribute tooltip when value is truncatable text. Defaults to value if value is a plain string. */
  fullText?: string;
}

export interface LinkedDealSummary {
  id: string;
  name: string;
  stage: PipelineStage;
  amount: number;
  currency: string;
}

export interface LinkedContactSummary {
  id: string;
  name: string;
  title: string;
}

export interface LinkedTicketSummary {
  id: string;
  subject: string;
  status: string;
}

export interface CrmDetailTemplateProps {
  entityType: CrmEntityType;
  title: string;
  /** Short line under the title, e.g. "VP Operations @ Acme Robotics" or a stage badge + amount. */
  metadata: React.ReactNode;
  breadcrumbs: Breadcrumb[];
  avatarInitials?: string;
  quickFacts: QuickFact[];
  timeline: TimelineEntry[];
  linkedDeals?: LinkedDealSummary[];
  linkedContacts?: LinkedContactSummary[];
  linkedTickets?: LinkedTicketSummary[];
}

const STAGE_BADGE_STYLE: Record<PipelineStage, { variant: NonNullable<StatusBadgeProps["variant"]>; filled?: boolean }> = {
  qualification: { variant: "info" },
  proposal: { variant: "warning" },
  negotiation: { variant: "warning" },
  closed_won: { variant: "success", filled: true },
  closed_lost: { variant: "danger" },
};

function QuickFactsPanel({ facts }: { facts: QuickFact[] }) {
  return (
    <div className="rounded-md border border-border bg-surface p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-neutral-950">Quick facts</h3>
      <dl className="flex flex-col gap-3 text-sm">
        {facts.map((fact) => (
          <div key={fact.label} className="flex items-start justify-between gap-3">
            <dt className="shrink-0 text-neutral-600">{fact.label}</dt>
            <dd
              className="min-w-0 truncate text-right text-neutral-950"
              title={fact.fullText ?? (typeof fact.value === "string" ? fact.value : undefined)}
            >
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function TimelineItem({ entry }: { entry: TimelineEntry }) {
  const isSystem = entry.is_system_event;
  return (
    <li className="flex items-start gap-3">
      {isSystem ? (
        <span className="size-8 shrink-0" aria-hidden="true" />
      ) : (
        <Avatar size="sm" className="shrink-0">
          <AvatarFallback>{getUserInitials(entry.author ?? "?")}</AvatarFallback>
        </Avatar>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-baseline gap-2">
          <span className={isSystem ? "text-xs text-neutral-600" : "text-sm font-medium text-neutral-950"}>
            {isSystem ? "System" : entry.author}
          </span>
          <span className="shrink-0 text-xs text-neutral-600">{formatRelativeTime(entry.created_at)}</span>
        </div>
        <p className={isSystem ? "text-xs text-neutral-600" : "text-sm text-neutral-950"}>{entry.body}</p>
      </div>
    </li>
  );
}

function sortByRecency(entries: TimelineEntry[]): TimelineEntry[] {
  return [...entries].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

function ActivityTab({ timeline, onAddNote }: { timeline: TimelineEntry[]; onAddNote: (body: string) => void }) {
  const [noteText, setNoteText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sorted = sortByRecency(timeline);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = noteText.trim();
    if (!body) return;
    setSubmitting(true);
    onAddNote(body);
    setSubmitting(false);
    setNoteText("");
    toast.success("Note added");
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          ref={inputRef}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add a note…"
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={!noteText.trim() || submitting}>
          <Plus className="size-3.5" />
          Add note
        </Button>
      </form>

      {sorted.length === 0 ? (
        <EmptyState
          variant="first-time"
          message="No activity yet — notes and system events will show up here."
          ctaLabel="Add note"
          onCtaClick={() => inputRef.current?.focus()}
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {sorted.map((entry) => (
            <TimelineItem key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </div>
  );
}

function NotesTab({ timeline, onGoToActivity }: { timeline: TimelineEntry[]; onGoToActivity: () => void }) {
  const notes = sortByRecency(timeline.filter((entry) => !entry.is_system_event));

  if (notes.length === 0) {
    return (
      <EmptyState
        variant="first-time"
        message="No notes yet — add one from the Activity tab."
        ctaLabel="Go to Activity"
        onCtaClick={onGoToActivity}
      />
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {notes.map((entry) => (
        <TimelineItem key={entry.id} entry={entry} />
      ))}
    </ul>
  );
}

function TicketsTab({ tickets }: { tickets: LinkedTicketSummary[] }) {
  if (tickets.length === 0) {
    return (
      <EmptyState
        variant="first-time"
        message="No linked tickets."
        ctaLabel="Create ticket"
        onCtaClick={() => toast.info("Ticket creation isn't wired up in this preview")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {tickets.map((ticket) => (
        <div key={ticket.id} className="flex items-center gap-3 rounded-md border border-border p-3">
          <TicketIcon className="size-4 shrink-0 text-neutral-600" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-sm text-neutral-950" title={ticket.subject}>
            {ticket.subject}
          </span>
          <StatusBadge variant="neutral">{ticket.status}</StatusBadge>
        </div>
      ))}
    </div>
  );
}

function LinkedDealsTab({ deals }: { deals: LinkedDealSummary[] }) {
  const router = useRouter();

  if (deals.length === 0) {
    return <EmptyState variant="first-time" message="No deals yet for this account." ctaLabel="View pipeline" onCtaClick={() => router.push("/crm/deals")} />;
  }

  return (
    <div className="flex flex-col gap-2">
      {deals.map((deal) => {
        const style = STAGE_BADGE_STYLE[deal.stage];
        return (
          <button
            key={deal.id}
            type="button"
            onClick={() => router.push(`/crm/deals/${deal.id}`)}
            className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-left hover:bg-neutral-50"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-sm font-medium text-neutral-950" title={deal.name}>
                {deal.name}
              </span>
              <StatusBadge variant={style.variant} filled={style.filled}>
                {PIPELINE_STAGE_LABELS[deal.stage]}
              </StatusBadge>
            </div>
            <span className="shrink-0 text-sm font-medium text-neutral-950">{formatCurrency(deal.amount, deal.currency)}</span>
          </button>
        );
      })}
    </div>
  );
}

function LinkedContactsTab({ contacts }: { contacts: LinkedContactSummary[] }) {
  const router = useRouter();

  if (contacts.length === 0) {
    return <EmptyState variant="first-time" message="No contacts yet for this account." ctaLabel="View contacts" onCtaClick={() => router.push("/crm/contacts")} />;
  }

  return (
    <div className="flex flex-col gap-2">
      {contacts.map((contact) => (
        <button
          key={contact.id}
          type="button"
          onClick={() => router.push(`/crm/contacts/${contact.id}`)}
          className="flex items-center gap-3 rounded-md border border-border p-3 text-left hover:bg-neutral-50"
        >
          <Avatar size="sm">
            <AvatarFallback>{getUserInitials(contact.name)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-neutral-950" title={contact.name}>
              {contact.name}
            </span>
            <span className="truncate text-xs text-neutral-600" title={contact.title}>
              {contact.title}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

export function CrmDetailTemplate({
  entityType,
  title,
  metadata,
  breadcrumbs,
  avatarInitials,
  quickFacts,
  timeline: initialTimeline,
  linkedDeals,
  linkedContacts,
  linkedTickets,
}: CrmDetailTemplateProps) {
  const [timeline, setTimeline] = useState(initialTimeline);
  const [activeTab, setActiveTab] = useState("activity");

  function handleAddNote(body: string) {
    const entry: TimelineEntry = {
      id: `note_${Math.random().toString(36).slice(2, 9)}`,
      entity_type: entityType,
      author: mockSession.user.name,
      body,
      is_system_event: false,
      created_at: MOCK_NOW.toISOString(),
    };
    setTimeline((prev) => [entry, ...prev]);
  }

  const tabs: DetailTab[] = [
    { value: "activity", label: "Activity", content: <ActivityTab timeline={timeline} onAddNote={handleAddNote} /> },
    ...(entityType === "company" ? [{ value: "contacts", label: "Contacts", content: <LinkedContactsTab contacts={linkedContacts ?? []} /> }] : []),
    ...(entityType !== "deal" ? [{ value: "deals", label: "Deals", content: <LinkedDealsTab deals={linkedDeals ?? []} /> }] : []),
    { value: "notes", label: "Notes", content: <NotesTab timeline={timeline} onGoToActivity={() => setActiveTab("activity")} /> },
    { value: "tickets", label: "Tickets", content: <TicketsTab tickets={linkedTickets ?? []} /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} breadcrumbs={breadcrumbs} />

      <DetailLayout
        header={
          <div className="flex min-w-0 items-center gap-4">
            {avatarInitials && (
              <Avatar size="lg" className="shrink-0">
                <AvatarFallback>{avatarInitials}</AvatarFallback>
              </Avatar>
            )}
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="truncate text-xl font-semibold text-neutral-950" title={title}>
                {title}
              </h1>
              <div className="flex min-w-0 items-center gap-2 text-sm text-neutral-600">{metadata}</div>
            </div>
          </div>
        }
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sidebar={<QuickFactsPanel facts={quickFacts} />}
      />
    </div>
  );
}
