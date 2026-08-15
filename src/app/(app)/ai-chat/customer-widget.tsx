"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Headphones, MessageCircle, Send, X } from "lucide-react";
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SourceChip, splitCitationText } from "@/app/(app)/ai-chat/source-popover";
import {
  getWidgetReply,
  mockWidgetConversation,
  nextChatMessageId,
  type ChatMessage,
} from "@/app/(app)/ai-chat/mock-chat";
import { useStreamingText } from "@/app/(app)/ai-chat/use-streaming-text";

function WidgetAssistantContent({ content, sources }: { content: string; sources: ChatMessage["sources"] }) {
  const segments = useMemo(() => splitCitationText(content), [content]);
  return (
    <p className="whitespace-pre-wrap">
      {segments.map((segment, index) =>
        segment.type === "text" ? (
          <Fragment key={index}>{segment.text}</Fragment>
        ) : (
          <SourceChip key={index} index={segment.index} source={sources[segment.index]} accent="brand" />
        )
      )}
    </p>
  );
}

function WidgetMessage({ message }: { message: ChatMessage }) {
  const displayed = useStreamingText(message.content, Boolean(message.streamed));

  if (message.role === "user") {
    return (
      <div className="self-end max-w-[85%] rounded-lg rounded-tr-sm border border-info/20 bg-info/10 px-3 py-2 text-sm text-neutral-950">
        {message.content}
      </div>
    );
  }

  return (
    <div className="self-start max-w-[85%]">
      <div className="rounded-lg rounded-tl-sm border border-border bg-neutral-50 px-3 py-2">
        <p className="mb-1 flex items-center gap-1 text-xs font-medium text-info">
          <MessageCircle className="size-3" aria-hidden="true" />
          Support Assistant
        </p>
        <WidgetAssistantContent content={displayed} sources={message.sources} />
      </div>
      {message.offerHandoff && (
        <div className="mt-1.5">
          <Button
            variant="outline"
            size="sm"
            className="border-info/40 bg-info/10 text-info hover:bg-info/20"
            onClick={() => toast.success("Ticket created — a human agent will follow up shortly.")}
          >
            Create ticket
          </Button>
        </div>
      )}
    </div>
  );
}

const QUICK_REPLIES = ["Export issue", "Login timeout"];

export function CustomerWidget() {
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>(mockWidgetConversation);
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isThinking]);

  function handleSend(body: string) {
    const text = body.trim();
    if (!text || isThinking) return;

    const userMessage: ChatMessage = {
      id: nextChatMessageId("wmsg"),
      role: "user",
      content: text,
      sources: [],
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsThinking(true);

    window.setTimeout(() => {
      const reply = getWidgetReply(text);
      const assistantMessage: ChatMessage = {
        id: nextChatMessageId("wmsg"),
        role: "assistant",
        content: reply.content,
        sources: reply.sources,
        created_at: new Date().toISOString(),
        offerHandoff: reply.offerHandoff,
        streamed: true,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsThinking(false);
    }, 1500);
  }

  if (!open) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          size="icon-lg"
          className="rounded-full bg-info text-white shadow-lg hover:bg-info/90"
          aria-label="Open support chat"
          onClick={() => setOpen(true)}
        >
          <MessageCircle className="size-5" aria-hidden="true" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex h-[32rem] w-[21rem] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
      <div className="flex shrink-0 items-center justify-between gap-2 bg-info px-3 py-2.5 text-white">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Support Assistant</p>
          <p className="text-xs text-white/80">Powered by Northlight knowledge base</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-white hover:bg-white/15 hover:text-white"
            onClick={() => toast.info("A human agent has been pinged — they'll join shortly.")}
          >
            <Headphones className="size-3.5" aria-hidden="true" />
            Talk to a human
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white hover:bg-white/15 hover:text-white"
            aria-label="Close chat"
            onClick={() => setOpen(false)}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {messages.map((message) => (
          <WidgetMessage key={message.id} message={message} />
        ))}
        {isThinking && (
          <div
            className="flex flex-col gap-1.5 self-start rounded-lg rounded-tl-sm border border-border bg-neutral-50 px-3 py-2"
            role="status"
            aria-label="Support AI is typing"
          >
            <div className="h-2 w-24 animate-ai-pulse rounded bg-neutral-300" />
            <div className="h-2 w-16 animate-ai-pulse rounded bg-neutral-300" />
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-border p-2.5">
        {!isThinking && (
          <div className="flex flex-wrap gap-1.5">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => handleSend(reply)}
                className="rounded-full border border-info/30 bg-info/5 px-2.5 py-1 text-xs text-info transition-colors hover:bg-info/15"
              >
                {reply}
              </button>
            ))}
          </div>
        )}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputText);
          }}
        >
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="How can we help?"
            className="flex-1"
            aria-label="Support message"
          />
          <Button
            type="submit"
            size="icon-sm"
            className="bg-info text-white hover:bg-info/90"
            disabled={!inputText.trim() || isThinking}
            aria-label="Send message"
          >
            <Send className="size-3.5" aria-hidden="true" />
          </Button>
        </form>
      </div>
    </div>
  );
}
