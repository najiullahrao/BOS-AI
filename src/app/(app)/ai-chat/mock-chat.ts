export interface ChatSource {
  id: string;
  title: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: ChatSource[];
  created_at: string;
  /** True when generated during this session — triggers the token-by-token reveal. */
  streamed?: boolean;
  /** True when the assistant could not answer confidently and is offering a human handoff. */
  offerHandoff?: boolean;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
}

export const REMOTE_WORK_REPLY =
  "According to the Remote Work Policy [1], employees may work fully remote with manager approval. The default expectation is hybrid (3 days in-office) unless a formal exception is granted.";

export const EXPORT_REPLY =
  "Large date-range exports can time out during peak hours [1]. The recommended workaround is to export in smaller monthly batches.";

export const NO_KB_REPLY = "I don't have information about that in the knowledge base.";

export const HANDOFF_REPLY = "I couldn't find a confident answer — would you like me to create a support ticket?";

export const REMOTE_WORK_SOURCE: ChatSource = { id: "kb_1", title: "Remote Work Policy" };
export const EXPORT_SOURCE: ChatSource = { id: "kb_2", title: "Exporting Large Reports" };

export const mockConversations: ChatConversation[] = [
  {
    id: "conv_1",
    title: "Remote work policy question",
    messages: [
      {
        id: "m1",
        role: "user",
        content: "Can employees work fully remote or is it hybrid only?",
        sources: [],
        created_at: "2026-07-11T09:00:00Z",
      },
      {
        id: "m2",
        role: "assistant",
        content: REMOTE_WORK_REPLY,
        sources: [REMOTE_WORK_SOURCE],
        created_at: "2026-07-11T09:00:04Z",
      },
    ],
  },
  {
    id: "conv_2",
    title: "Export timeout workaround",
    messages: [
      {
        id: "m3",
        role: "user",
        content: "Why do large exports time out?",
        sources: [],
        created_at: "2026-07-10T14:00:00Z",
      },
      {
        id: "m4",
        role: "assistant",
        content: EXPORT_REPLY,
        sources: [EXPORT_SOURCE],
        created_at: "2026-07-10T14:00:05Z",
      },
    ],
  },
  {
    id: "conv_3",
    title: "Question with no KB match",
    messages: [
      {
        id: "m5",
        role: "user",
        content: "What is the company's policy on cryptocurrency payments?",
        sources: [],
        created_at: "2026-07-09T11:00:00Z",
      },
      {
        id: "m6",
        role: "assistant",
        content: NO_KB_REPLY,
        sources: [],
        created_at: "2026-07-09T11:00:04Z",
      },
    ],
  },
];

export const mockWidgetConversation: ChatMessage[] = [
  {
    id: "w1",
    role: "user",
    content: "Do you offer refunds after 30 days?",
    sources: [],
    created_at: "2026-07-11T10:00:00Z",
  },
  {
    id: "w2",
    role: "assistant",
    content:
      "I don't have information about that in our knowledge base. Would you like me to create a support ticket so a team member can help?",
    sources: [],
    created_at: "2026-07-11T10:00:03Z",
    offerHandoff: true,
  },
];

export function getInternalReply(text: string): { content: string; sources: ChatSource[] } {
  const lower = text.toLowerCase();
  if (lower.includes("remote") || lower.includes("hybrid")) {
    return { content: REMOTE_WORK_REPLY, sources: [REMOTE_WORK_SOURCE] };
  }
  if (lower.includes("export") || lower.includes("timeout")) {
    return { content: EXPORT_REPLY, sources: [EXPORT_SOURCE] };
  }
  return { content: NO_KB_REPLY, sources: [] };
}

export interface WidgetReply {
  content: string;
  sources: ChatSource[];
  offerHandoff: boolean;
}

/**
 * Same keyword matching as the internal chat, but only public KB documents
 * may be cited on the customer-facing surface. The remote-work policy is
 * internal, so "remote"/"hybrid" answers fall back to a human handoff here.
 */
export function getWidgetReply(text: string): WidgetReply {
  const lower = text.toLowerCase();
  if (lower.includes("export") || lower.includes("timeout")) {
    return { content: EXPORT_REPLY, sources: [EXPORT_SOURCE], offerHandoff: false };
  }
  return { content: HANDOFF_REPLY, sources: [], offerHandoff: true };
}

export function nextChatMessageId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
