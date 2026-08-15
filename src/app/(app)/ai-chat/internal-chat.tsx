"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Send } from "lucide-react";
import { AIPanel } from "@/components/shared/ai-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getUserInitials, mockSession } from "@/lib/mock-data";
import { formatRelativeTime } from "@/lib/mock-crm";
import { cn } from "@/lib/utils";
import { SourceChip, splitCitationText } from "@/app/(app)/ai-chat/source-popover";
import {
  getInternalReply,
  mockConversations,
  nextChatMessageId,
  type ChatConversation,
  type ChatMessage,
} from "@/app/(app)/ai-chat/mock-chat";
import { useStreamingText } from "@/app/(app)/ai-chat/use-streaming-text";

function AssistantContent({ content, sources }: { content: string; sources: ChatMessage["sources"] }) {
  const segments = useMemo(() => splitCitationText(content), [content]);
  return (
    <p className="whitespace-pre-wrap">
      {segments.map((segment, index) =>
        segment.type === "text" ? (
          <Fragment key={index}>{segment.text}</Fragment>
        ) : (
          <SourceChip key={index} index={segment.index} source={sources[segment.index]} />
        )
      )}
    </p>
  );
}

function AssistantMessage({
  message,
  onInsert,
  onDiscard,
}: {
  message: ChatMessage;
  onInsert: (content: string) => void;
  onDiscard: (messageId: string) => void;
}) {
  const displayed = useStreamingText(message.content, Boolean(message.streamed));
  return (
    <div className="flex w-full justify-start">
      <div className="w-full max-w-[min(100%,40rem)]">
        <AIPanel
          label="AI Suggested"
          content={<AssistantContent content={displayed} sources={message.sources} />}
          onEdit={() => onInsert(message.content)}
          onInsert={() => onInsert(message.content)}
          onDiscard={() => onDiscard(message.id)}
        />
      </div>
    </div>
  );
}

function UserMessage({ message }: { message: ChatMessage }) {
  const initials = getUserInitials(mockSession.user.name);
  return (
    <div className="flex w-full justify-end gap-2">
      <div className="max-w-[min(100%,32rem)] rounded-md border border-border bg-neutral-50 px-3 py-2 text-sm text-neutral-950">
        {message.content}
      </div>
      <Avatar size="sm" className="mt-0.5 shrink-0">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    </div>
  );
}

export function InternalChat() {
  const [conversations, setConversations] = useState<ChatConversation[]>(mockConversations);
  const [activeId, setActiveId] = useState<string>(mockConversations[0].id);
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const composerRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  const sortedConversations = useMemo(
    () =>
      [...conversations].sort((a, b) => {
        const aTime = a.messages[a.messages.length - 1]?.created_at ?? "";
        const bTime = b.messages[b.messages.length - 1]?.created_at ?? "";
        return bTime.localeCompare(aTime);
      }),
    [conversations]
  );

  const active = conversations.find((c) => c.id === activeId) ?? sortedConversations[0];

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activeId, active?.messages.length, isThinking]);

  function handleNewConversation() {
    const conversation: ChatConversation = {
      id: nextChatMessageId("conv"),
      title: "New conversation",
      messages: [],
    };
    setConversations((prev) => [conversation, ...prev]);
    setActiveId(conversation.id);
    setInputText("");
  }

  function handleInsert(content: string) {
    setInputText(content);
    composerRef.current?.focus();
  }

  function handleDiscardMessage(messageId: string) {
    if (!active) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === active.id ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) } : c))
    );
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!active) return;
    const body = inputText.trim();
    if (!body || isThinking) return;

    const userMessage: ChatMessage = {
      id: nextChatMessageId("msg"),
      role: "user",
      content: body,
      sources: [],
      created_at: new Date().toISOString(),
    };
    const conversationId = active.id;

    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, messages: [...c.messages, userMessage] } : c))
    );
    setInputText("");
    setIsThinking(true);

    window.setTimeout(() => {
      const reply = getInternalReply(body);
      const assistantMessage: ChatMessage = {
        id: nextChatMessageId("msg"),
        role: "assistant",
        content: reply.content,
        sources: reply.sources,
        created_at: new Date().toISOString(),
        streamed: true,
      };
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, messages: [...c.messages, assistantMessage] } : c))
      );
      setIsThinking(false);
    }, 1500);
  }

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100dvh-13rem)] lg:min-h-[32rem] lg:flex-row">
      <aside className="flex shrink-0 flex-col gap-3 lg:w-80">
        <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={handleNewConversation}>
          <Plus className="size-3.5" />
          New conversation
        </Button>

        <div className="flex flex-col gap-2 overflow-y-auto lg:flex-1 lg:pr-1">
          {sortedConversations.map((conversation) => {
            const lastMessage = conversation.messages[conversation.messages.length - 1];
            const preview = lastMessage ? lastMessage.content : "No messages yet";
            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setActiveId(conversation.id)}
                className={cn(
                  "flex flex-col gap-0.5 rounded-md border p-3 text-left transition-colors",
                  conversation.id === activeId
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-surface hover:bg-neutral-50"
                )}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium text-neutral-950">{conversation.title}</span>
                  {lastMessage && (
                    <span className="shrink-0 text-xs text-neutral-600">
                      {formatRelativeTime(lastMessage.created_at)}
                    </span>
                  )}
                </span>
                <span className="truncate text-xs text-neutral-600">{preview}</span>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="flex h-[34rem] min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-border bg-surface lg:h-full">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-3 py-2">
          <h2 className="truncate text-sm font-semibold text-neutral-950">{active?.title}</h2>
          {active && active.messages.length > 0 && (
            <span className="shrink-0 text-xs text-neutral-600">
              {active.messages.length} message{active.messages.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <div ref={messagesRef} className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {active && active.messages.length === 0 && !isThinking ? (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState
                variant="first-time"
                message="No messages yet — ask about a policy, a known issue, or anything in the knowledge base."
                ctaLabel="Start typing"
                onCtaClick={() => composerRef.current?.focus()}
              />
            </div>
          ) : (
            <>
              {active?.messages.map((message) =>
                message.role === "user" ? (
                  <UserMessage key={message.id} message={message} />
                ) : (
                  <AssistantMessage
                    key={message.id}
                    message={message}
                    onInsert={handleInsert}
                    onDiscard={handleDiscardMessage}
                  />
                )
              )}
              {isThinking && (
                <div className="flex w-full justify-start">
                  <div className="w-full max-w-[min(100%,40rem)]">
                    <AIPanel label="AI Suggested" state="thinking" content={null} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <form onSubmit={handleSend} className="flex shrink-0 gap-2 border-t border-border p-3">
          <Input
            ref={composerRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about policies, known issues, or anything in the knowledge base…"
            className="flex-1"
            aria-label="Chat message"
          />
          <Button type="submit" size="sm" disabled={!inputText.trim() || isThinking}>
            <Send className="size-3.5" />
            Send
          </Button>
        </form>
      </section>
    </div>
  );
}
