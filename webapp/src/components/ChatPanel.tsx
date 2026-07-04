"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { DocumentSidebar } from "@/components/DocumentSidebar";
import { MarkdownContent } from "@/components/MarkdownContent";
import {
  alertErrorClass,
  buttonPrimaryClass,
  inputClass,
} from "@/components/ui/classes";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citation?: string | null;
  totalTokens: number;
  createdAt: string;
}

interface ConversationOption {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface DocumentOption {
  id: string;
  originalName: string;
}

type ChatStreamEvent =
  | { type: "delta"; text?: string }
  | {
      type: "done";
      citation?: string | null;
      totalTokens?: number;
      sessionTotalTokens?: number;
      conversationTotalTokens?: number;
    }
  | { type: "error"; error?: string; hint?: string };

export function ChatPanel() {
  const [conversations, setConversations] = useState<ConversationOption[]>([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [documents, setDocuments] = useState<DocumentOption[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [errorHint, setErrorHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [sessionTotalTokens, setSessionTotalTokens] = useState(0);
  const [conversationTotalTokens, setConversationTotalTokens] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function fetchConversations(): Promise<ConversationOption[]> {
    const response = await fetch("/api/conversations");
    if (response.status === 401) {
      window.location.href = "/login?from=/chat";
      return [];
    }
    if (!response.ok) return [];

    const data = (await response.json()) as { conversations: ConversationOption[] };
    return data.conversations;
  }

  async function loadConversationMessages(conversationId: string) {
    const response = await fetch(`/api/chat?conversationId=${conversationId}`);
    if (!response.ok) return;

    const data = (await response.json()) as {
      messages: ChatMessage[];
      sessionTotalTokens: number;
      conversationTotalTokens: number;
    };
    setMessages(data.messages.filter((message) => message.content.trim().length > 0));
    setSessionTotalTokens(data.sessionTotalTokens);
    setConversationTotalTokens(data.conversationTotalTokens);
  }

  async function selectConversation(conversationId: string) {
    setActiveConversationId(conversationId);
    setSelectedDocumentId("");
    setError("");
    setErrorHint("");
    setSidebarOpen(false);
    await loadConversationMessages(conversationId);
  }

  async function createNewConversation(): Promise<ConversationOption | null> {
    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as { conversation: ConversationOption };
    return data.conversation;
  }

  async function initialize() {
    setConversationsLoading(true);
    const existing = await fetchConversations();

    if (existing.length === 0) {
      const created = await createNewConversation();
      if (created) {
        setConversations([created]);
        setActiveConversationId(created.id);
        setMessages([]);
      }
    } else {
      setConversations(existing);
      setActiveConversationId(existing[0].id);
      await loadConversationMessages(existing[0].id);
    }
    setConversationsLoading(false);
  }

  useEffect(() => {
    // setState only happens after awaited fetches — not a synchronous cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void initialize();
    // Run once on mount only — initialize() is stable for the component's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleNewChat() {
    const created = await createNewConversation();
    if (!created) return;

    setConversations((prev) => [created, ...prev]);
    setActiveConversationId(created.id);
    setSelectedDocumentId("");
    setMessages([]);
    setConversationTotalTokens(0);
    setError("");
    setErrorHint("");
    setSidebarOpen(false);
  }

  async function handleDeleteConversation(conversationId: string) {
    const confirmed = window.confirm("Delete this chat? This cannot be undone.");
    if (!confirmed) return;

    const response = await fetch(`/api/conversations/${conversationId}`, {
      method: "DELETE",
    });
    if (!response.ok) return;

    const remaining = conversations.filter((c) => c.id !== conversationId);
    setConversations(remaining);

    if (conversationId !== activeConversationId) return;

    if (remaining.length > 0) {
      await selectConversation(remaining[0].id);
    } else {
      const created = await createNewConversation();
      if (created) {
        setConversations([created]);
        setActiveConversationId(created.id);
        setMessages([]);
        setConversationTotalTokens(0);
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage();
  }

  function handleTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  async function sendMessage() {
    const message = input.trim();
    if (!message || loading || !activeConversationId) return;

    setError("");
    setErrorHint("");
    setLoading(true);
    setInput("");

    const optimisticUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: message,
      totalTokens: 0,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);

    const streamingId = `assistant-${Date.now()}`;
    const conversationId = activeConversationId;

    try {
      const payload: { message: string; documentId?: string; conversationId: string } = {
        message,
        conversationId,
      };
      if (selectedDocumentId) {
        payload.documentId = selectedDocumentId;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type") ?? "";

      // Validation/auth/rate-limit failures come back as plain JSON, not a stream.
      if (!response.ok || !contentType.includes("text/event-stream") || !response.body) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
          hint?: string;
        };
        console.error("[chat] API error", {
          status: response.status,
          error: data.error,
          hint: data.hint,
        });
        setError(data.error ?? "Chat request failed");
        setErrorHint(data.hint ?? "Open browser DevTools (F12) → Console for details.");
        setMessages((prev) => prev.filter((item) => item.id !== optimisticUserMessage.id));
        setInput(message);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: streamingId,
          role: "assistant",
          content: "",
          totalTokens: 0,
          createdAt: new Date().toISOString(),
        },
      ]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamedContent = "";
      let streamError: { error: string; hint?: string } | null = null;

      const processLine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) return;

        let event: ChatStreamEvent;
        try {
          event = JSON.parse(trimmed.slice(5).trim()) as ChatStreamEvent;
        } catch {
          return;
        }

        if (event.type === "delta") {
          streamedContent += event.text ?? "";
          setMessages((prev) =>
            prev.map((item) =>
              item.id === streamingId ? { ...item, content: streamedContent } : item,
            ),
          );
        } else if (event.type === "done") {
          const totalTokens = event.totalTokens ?? 0;
          setMessages((prev) =>
            prev.map((item) =>
              item.id === streamingId
                ? { ...item, totalTokens, citation: event.citation ?? null }
                : item,
            ),
          );
          setSessionTotalTokens(event.sessionTotalTokens ?? 0);
          setConversationTotalTokens(event.conversationTotalTokens ?? 0);
        } else if (event.type === "error") {
          streamError = {
            error: event.error ?? "Chat request failed",
            hint: event.hint,
          };
        }
      };

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          processLine(line);
        }
      }
      if (buffer) processLine(buffer);

      if (streamError) {
        const failed = streamError as { error: string; hint?: string };
        console.error("[chat] stream error", failed);
        setError(failed.error);
        setErrorHint(failed.hint ?? "Try again in a moment.");
        if (!streamedContent) {
          setMessages((prev) =>
            prev.filter(
              (item) => item.id !== streamingId && item.id !== optimisticUserMessage.id,
            ),
          );
          setInput(message);
        }
      } else {
        // Refresh the sidebar: picks up the auto-generated title on the first
        // message, and keeps ordering in sync with the server's "most recently
        // active" sort on every later message.
        const refreshed = await fetchConversations();
        if (refreshed.length > 0) setConversations(refreshed);
      }
    } catch (networkError) {
      console.error("[chat] network error", networkError);
      setError("Unable to reach the server. Please try again.");
      setErrorHint("Check that Docker or npm run dev is still running.");
      setMessages((prev) =>
        prev.filter(
          (item) => item.id !== streamingId && item.id !== optimisticUserMessage.id,
        ),
      );
      setInput(message);
    } finally {
      setLoading(false);
    }
  }

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const selectedDocument = documents.find((doc) => doc.id === selectedDocumentId);

  return (
    <div className="flex h-[calc(100vh-4.25rem)]">
      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-200 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-slate-200 p-3">
          <button
            type="button"
            onClick={() => void handleNewChat()}
            className={`${buttonPrimaryClass} w-full`}
          >
            + New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {conversationsLoading ? (
            <p className="px-2 py-1.5 text-xs text-slate-400">Loading chats...</p>
          ) : (
            <ul className="space-y-0.5">
              {conversations.map((conversation) => (
                <li
                  key={conversation.id}
                  className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm transition ${
                    conversation.id === activeConversationId
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => void selectConversation(conversation.id)}
                    className="min-w-0 flex-1 truncate text-left"
                    title={conversation.title}
                  >
                    {conversation.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteConversation(conversation.id)}
                    className="shrink-0 rounded px-1 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                    aria-label={`Delete ${conversation.title}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-slate-200 p-3">
          <DocumentSidebar
            selectedDocumentId={selectedDocumentId}
            onSelectDocument={setSelectedDocumentId}
            onDocumentsChange={setDocuments}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-600 md:hidden"
              aria-label="Open chats"
            >
              ☰
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-slate-900">
                {activeConversation?.title ?? "Chat"}
              </h1>
              <p className="text-sm text-slate-500">
                Ask anything, or pick a document from the sidebar.
              </p>
            </div>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm">
            This chat:{" "}
            <span className="font-semibold text-blue-700">
              {conversationTotalTokens.toLocaleString()}
            </span>{" "}
            · Total:{" "}
            <span className="font-semibold text-blue-700">
              {sessionTotalTokens.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
          {messages.length === 0 ? (
            <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <p className="text-sm font-medium text-slate-800">Start a conversation</p>
              <p className="mt-1 text-sm text-slate-500">
                Pick a document from the sidebar and try &quot;Summarize this
                document&quot;, or just ask a general question.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[75%] ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 bg-white text-slate-900"
                  }`}
                >
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide opacity-70">
                    {message.role === "user" ? "You" : "Assistant"}
                  </p>
                  {message.role === "assistant" ? (
                    message.content ? (
                      <MarkdownContent content={message.content} />
                    ) : (
                      <p className="animate-pulse text-slate-400">Thinking...</p>
                    )
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  )}
                  {message.role === "assistant" && message.citation ? (
                    <p className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-500">
                      📄 Source: {message.citation}
                    </p>
                  ) : null}
                  {message.role === "assistant" && message.totalTokens > 0 ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {message.totalTokens.toLocaleString()} tokens
                    </p>
                  ) : null}
                </div>
              </div>
            ))
          )}
          {loading && messages[messages.length - 1]?.role === "user" ? (
            <p className="text-center text-sm text-slate-500">Assistant is thinking...</p>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-slate-200 bg-slate-50 px-4 py-4 sm:px-6"
        >
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            {selectedDocumentId ? (
              <p className="text-xs text-slate-500">
                Chatting with <span className="font-medium">{selectedDocument?.originalName ?? "the selected document"}</span> as context.
              </p>
            ) : null}

            <textarea
              id="message"
              rows={3}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder="Type your question here..."
              className={`${inputClass} resize-none`}
              disabled={loading}
            />
            <p className="text-xs text-slate-400">
              Press Enter to send, Shift+Enter for a new line.
            </p>

            {error ? (
              <div className="space-y-2">
                <p className={alertErrorClass}>
                  <span className="font-semibold">Error:</span> {error}
                </p>
                {errorHint ? (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <span className="font-semibold">How to fix:</span> {errorHint}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className={buttonPrimaryClass}
              >
                {loading ? "Sending..." : "Send message"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
