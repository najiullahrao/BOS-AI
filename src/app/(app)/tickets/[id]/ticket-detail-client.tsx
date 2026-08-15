"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, FileText, History, Lock } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DetailLayout, type DetailTab } from "@/components/shared/detail-layout";
import { StatusBadge } from "@/components/shared/status-badge";
import { AIPanel } from "@/components/shared/ai-panel";
import { Drawer } from "@/components/shared/drawer";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "@/components/shared/toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getUserInitials } from "@/lib/mock-data";
import { formatFullDate, formatRelativeTime, getContactFullName, getDealsForContact } from "@/lib/mock-crm";
import { mockTeamMembers } from "@/lib/mock-team";
import { formatRunDuration, getRunsForAgent, recordAgentRun, type AgentRun } from "@/lib/mock-agent-runs";
import {
  getCrmRecordForContactName,
  getMockSuggestReply,
  getMockThreadSummary,
  getSlaBadge,
  getTicketCountForContact,
  PRIORITY_BADGE_VARIANT,
  PRIORITY_LABELS,
  STATUS_BADGE_VARIANT,
  STATUS_LABELS,
  delay,
  type AiSuggestReply,
  type Ticket,
  type TicketComment,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/mock-tickets";

const UNASSIGNED_VALUE = "__unassigned__";

function CommentBubble({ comment }: { comment: TicketComment }) {
  if (comment.is_internal_note) {
    return (
      <div className="flex flex-col gap-1.5 rounded-md border border-warning/30 bg-warning/10 p-3">
        <div className="flex items-center gap-2">
          <Lock className="size-3.5 text-warning" aria-hidden="true" />
          <span className="text-xs font-semibold text-warning">Internal note</span>
          <span className="text-xs text-neutral-600">{comment.author}</span>
          <span className="ml-auto shrink-0 text-xs text-neutral-600">{formatFullDate(comment.created_at)}</span>
        </div>
        <p className="text-sm text-neutral-950">{comment.body}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-border bg-surface p-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-neutral-950">{comment.author}</span>
        <span className="ml-auto shrink-0 text-xs text-neutral-600">{formatFullDate(comment.created_at)}</span>
      </div>
      <p className="text-sm text-neutral-950">{comment.body}</p>
    </div>
  );
}

function SuggestReplyContent({ suggestion }: { suggestion: AiSuggestReply }) {
  return (
    <div className="flex flex-col gap-3">
      {suggestion.confidence === "ungrounded" && (
        <p className="rounded-md border border-warning/30 bg-warning/10 px-2.5 py-2 text-xs text-neutral-950">
          I don&apos;t have relevant knowledge base content for this — here&apos;s a general suggestion.
        </p>
      )}
      <p>{suggestion.draft}</p>
      {suggestion.sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2">
          <span className="text-xs text-neutral-600">Sources:</span>
          {suggestion.sources.map((source, index) => (
            <button
              key={source.id}
              type="button"
              title={source.chunkPreview}
              onClick={() => toast.info(source.chunkPreview)}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-neutral-50 px-2 py-0.5 text-xs text-neutral-950 hover:bg-neutral-100"
            >
              <FileText className="size-3" aria-hidden="true" />
              [{index + 1}] {source.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const STATUS_OPTIONS = Object.keys(STATUS_LABELS) as TicketStatus[];
const PRIORITY_OPTIONS = Object.keys(PRIORITY_LABELS) as TicketPriority[];

export function TicketDetailClient({ ticket: initialTicket, initialComments }: { ticket: Ticket; initialComments: TicketComment[] }) {
  const [ticket, setTicket] = useState(initialTicket);
  const [comments, setComments] = useState(initialComments);
  const [replyText, setReplyText] = useState("");
  const replyRef = useRef<HTMLTextAreaElement>(null);

  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestState, setSuggestState] = useState<"thinking" | "default">("thinking");
  const [suggestion, setSuggestion] = useState<AiSuggestReply | null>(null);

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryState, setSummaryState] = useState<"thinking" | "default">("thinking");
  const [summary, setSummary] = useState<string | null>(null);

  const [historyOpen, setHistoryOpen] = useState(false);

  const sla = getSlaBadge(ticket);
  const crmRecord = getCrmRecordForContactName(ticket.contact);
  const pastTicketCount = getTicketCountForContact(ticket.contact, ticket.id);
  const assignableMembers = mockTeamMembers.filter((m) => m.status === "active");

  function updateTicket(patch: Partial<Ticket>) {
    setTicket((prev) => ({ ...prev, ...patch }));
  }

  async function handleSuggestReply() {
    setSuggestOpen(true);
    setSuggestState("thinking");
    setSuggestion(null);
    await delay(700);
    setSuggestion(getMockSuggestReply(ticket.id));
    setSuggestState("default");
    recordAgentRun({ agent: "support", title: `Suggest Reply · ${ticket.subject}`, status: "completed", duration_ms: 700 });
  }

  async function handleSummarize() {
    setSummaryOpen(true);
    setSummaryState("thinking");
    setSummary(null);
    await delay(500);
    setSummary(getMockThreadSummary(ticket.id));
    setSummaryState("default");
    recordAgentRun({ agent: "support", title: `Summarize Thread · ${ticket.subject}`, status: "completed", duration_ms: 500 });
  }

  function insertDraft(closePanel: boolean) {
    if (!suggestion) return;
    setReplyText(suggestion.draft);
    if (closePanel) setSuggestOpen(false);
    requestAnimationFrame(() => replyRef.current?.focus());
  }

  function handleSendReply() {
    const body = replyText.trim();
    if (!body) return;
    const comment: TicketComment = {
      id: `cm_${Math.random().toString(36).slice(2, 9)}`,
      ticket_id: ticket.id,
      author: "You",
      body,
      is_internal_note: false,
      created_at: new Date().toISOString(),
    };
    setComments((prev) => [...prev, comment]);
    setReplyText("");
    toast.success("Reply sent");
  }

  const conversationTab = (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleSuggestReply}>
          <Sparkles className="size-3.5" />
          Suggest Reply
        </Button>
        <Button variant="outline" size="sm" onClick={handleSummarize}>
          <FileText className="size-3.5" />
          Summarize Thread
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)}>
          <History className="size-3.5" />
          Run history
        </Button>
      </div>

      {summaryOpen && (
        <AIPanel
          label="Thread Summary"
          state={summaryState}
          onDiscard={() => setSummaryOpen(false)}
          onEdit={() => setSummaryOpen(false)}
          onInsert={() => setSummaryOpen(false)}
          content={summary}
        />
      )}

      {comments.length === 0 ? (
        <EmptyState variant="first-time" message="No messages yet." ctaLabel="Focus reply box" onCtaClick={() => replyRef.current?.focus()} />
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((comment) => (
            <CommentBubble key={comment.id} comment={comment} />
          ))}
        </div>
      )}

      {suggestOpen && (
        <AIPanel
          label="AI Suggested Reply"
          state={suggestState}
          onDiscard={() => setSuggestOpen(false)}
          onEdit={() => insertDraft(false)}
          onInsert={() => insertDraft(true)}
          content={suggestion ? <SuggestReplyContent suggestion={suggestion} /> : null}
        />
      )}

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <Textarea
          ref={replyRef}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Write a reply to the customer…"
          rows={4}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSendReply} disabled={!replyText.trim()}>
            Send reply
          </Button>
        </div>
      </div>
    </div>
  );

  const tabs: DetailTab[] = [{ value: "conversation", label: "Conversation", content: conversationTab }];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={ticket.subject}
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Tickets", href: "/tickets" }, { label: ticket.subject }]}
      />

      <DetailLayout
        header={
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-semibold text-neutral-950" title={ticket.subject}>
                {ticket.subject}
              </h1>
              <p className="text-sm text-neutral-600">
                Contact: <span className="text-neutral-950">{ticket.contact}</span> · SLA:{" "}
                <StatusBadge variant={sla.variant} className="ml-1 align-middle">
                  {sla.label}
                </StatusBadge>
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-neutral-600">Priority</Label>
                <Select value={ticket.priority} onValueChange={(value) => updateTicket({ priority: value as TicketPriority })}>
                  <SelectTrigger className="w-36" aria-label="Priority">
                    <StatusBadge variant={PRIORITY_BADGE_VARIANT[ticket.priority]}>
                      <SelectValue />
                    </StatusBadge>
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PRIORITY_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-xs text-neutral-600">Status</Label>
                <Select
                  value={ticket.status}
                  onValueChange={(value) => {
                    updateTicket({ status: value as TicketStatus });
                    toast.success(`Status set to ${STATUS_LABELS[value as TicketStatus]}`);
                  }}
                >
                  <SelectTrigger className="w-32" aria-label="Status">
                    <StatusBadge variant={STATUS_BADGE_VARIANT[ticket.status]}>
                      <SelectValue />
                    </StatusBadge>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-xs text-neutral-600">Assignee</Label>
                <Select
                  value={ticket.assignee ?? UNASSIGNED_VALUE}
                  onValueChange={(value) => {
                    const assignee = value === UNASSIGNED_VALUE ? null : value;
                    updateTicket({ assignee });
                    toast.success(assignee ? `Assigned to ${assignee}` : "Unassigned");
                  }}
                >
                  <SelectTrigger className="w-40" aria-label="Assignee">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
                    {assignableMembers.map((m) => (
                      <SelectItem key={m.id} value={m.name}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        }
        tabs={tabs}
        sidebar={<ContactSidebar contactName={ticket.contact} pastTicketCount={pastTicketCount} record={crmRecord} />}
      />

      <SupportRunHistoryDrawer open={historyOpen} onOpenChange={setHistoryOpen} />
    </div>
  );
}

function SupportRunHistoryDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const runs = getRunsForAgent("support");

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title="Support Agent run history"
      description="Recent runs of the Support Agent across tickets."
      footer={
        <Link href="/ai-agents/runs?agent=support" className="w-full">
          <Button variant="outline" size="sm" className="w-full">
            View all in run history
          </Button>
        </Link>
      }
    >
      {runs.length === 0 ? (
        <EmptyState variant="first-time" message="No Support Agent runs yet." ctaLabel="Close" onCtaClick={() => onOpenChange(false)} />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {runs.map((run: AgentRun) => (
            <li key={run.id} className="flex flex-col gap-1 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-950" title={run.title}>
                  {run.title}
                </span>
                <StatusBadge variant={run.status === "completed" ? "success" : run.status === "failed" ? "danger" : "warning"}>
                  {run.status}
                </StatusBadge>
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-600">
                <span>{formatRelativeTime(run.created_at)}</span>
                <span aria-hidden="true">·</span>
                <span>{formatRunDuration(run.duration_ms)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}

function ContactSidebar({
  contactName,
  pastTicketCount,
  record,
}: {
  contactName: string;
  pastTicketCount: number;
  record: ReturnType<typeof getCrmRecordForContactName>;
}) {
  if (!record) {
    return (
      <div className="rounded-md border border-border bg-surface p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-neutral-950">Contact</h3>
        <p className="text-sm text-neutral-600">{contactName}</p>
      </div>
    );
  }

  if (record.type === "lead") {
    const lead = record.lead!;
    return (
      <div className="rounded-md border border-border bg-surface p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-neutral-950">Contact</h3>
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback>{getUserInitials(lead.contactName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <Link href="/crm/leads" className="truncate text-sm font-medium text-primary hover:underline">
              {lead.contactName}
            </Link>
            <p className="text-xs text-neutral-600">Lead — not yet converted to a contact</p>
          </div>
        </div>
        <dl className="mt-3 flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-neutral-600">Lead status</dt>
            <dd className="text-neutral-950 capitalize">{lead.status}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-neutral-600">Past tickets</dt>
            <dd className="text-neutral-950">{pastTicketCount}</dd>
          </div>
        </dl>
      </div>
    );
  }

  const contact = record.contact!;
  const fullName = getContactFullName(contact);
  const deals = getDealsForContact(contact.id);

  return (
    <div className="rounded-md border border-border bg-surface p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-neutral-950">Contact</h3>
      <div className="flex items-center gap-3">
        <Avatar size="lg">
          <AvatarFallback>{getUserInitials(fullName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <Link href={`/crm/contacts/${contact.id}`} className="truncate text-sm font-medium text-primary hover:underline">
            {fullName}
          </Link>
          <p className="truncate text-xs text-neutral-600" title={contact.email}>
            {contact.email}
          </p>
        </div>
      </div>

      <dl className="mt-3 flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-neutral-600">Past tickets</dt>
          <dd className="text-neutral-950">{pastTicketCount}</dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-border pt-3">
        <h4 className="mb-2 text-xs font-medium text-neutral-600">Recent deals</h4>
        {deals.length === 0 ? (
          <p className="text-xs text-neutral-600">No deals yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {deals.map((deal) => (
              <li key={deal.id}>
                <Link href={`/crm/deals/${deal.id}`} className="block truncate text-xs text-primary hover:underline" title={deal.name}>
                  {deal.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
