"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  alertErrorClass,
  buttonPrimaryClass,
  cardClass,
  inputClass,
  labelClass,
} from "@/components/ui/classes";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  totalTokens: number;
  createdAt: string;
}

interface DocumentOption {
  id: string;
  originalName: string;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [documents, setDocuments] = useState<DocumentOption[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [errorHint, setErrorHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionTotalTokens, setSessionTotalTokens] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadInitialData() {
    const [chatResponse, docsResponse] = await Promise.all([
      fetch("/api/chat"),
      fetch("/api/documents"),
    ]);

    if (chatResponse.ok) {
      const chatData = (await chatResponse.json()) as {
        messages: ChatMessage[];
        sessionTotalTokens: number;
      };
      setMessages(
        chatData.messages.filter((message) => message.content.trim().length > 0),
      );
      setSessionTotalTokens(chatData.sessionTotalTokens);
    } else if (chatResponse.status === 401) {
      window.location.href = "/login?from=/chat";
      return;
    }

    if (docsResponse.ok) {
      const docsData = (await docsResponse.json()) as {
        documents: DocumentOption[];
      };
      setDocuments(docsData.documents);
    }
  }

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

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

    try {
      const payload: { message: string; documentId?: string } = { message };
      if (selectedDocumentId) {
        payload.documentId = selectedDocumentId;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        error?: string;
        hint?: string;
        code?: string;
        reply?: string;
        totalTokens?: number;
        sessionTotalTokens?: number;
      };

      if (!response.ok || !data.reply?.trim()) {
        console.error("[chat] API error", {
          status: response.status,
          code: data.code,
          error: data.error,
          hint: data.hint,
          reply: data.reply,
        });
        setError(data.error ?? "Chat request failed");
        setErrorHint(data.hint ?? "Open browser DevTools (F12) → Console for details.");
        setMessages((prev) => prev.filter((item) => item.id !== optimisticUserMessage.id));
        setInput(message);
        return;
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply ?? "",
        totalTokens: data.totalTokens ?? 0,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setSessionTotalTokens(data.sessionTotalTokens ?? 0);
    } catch (networkError) {
      console.error("[chat] network error", networkError);
      setError("Unable to reach the server. Please try again.");
      setErrorHint("Check that Docker or npm run dev is still running.");
      setMessages((prev) => prev.filter((item) => item.id !== optimisticUserMessage.id));
      setInput(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4.25rem)] max-w-5xl flex-col px-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 py-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Chat</h1>
          <p className="text-sm text-slate-500">Ask anything, or attach an uploaded document.</p>
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm">
          Session tokens:{" "}
          <span className="font-semibold text-blue-700">
            {sessionTotalTokens.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <div className={`${cardClass} text-center`}>
            <p className="text-sm font-medium text-slate-800">Start a conversation</p>
            <p className="mt-1 text-sm text-slate-500">
              Try &quot;Summarize this document&quot; after selecting a file below, or ask a general
              question.
            </p>
            {documents.length === 0 ? (
              <Link
                href="/upload"
                className="mt-4 inline-flex text-sm font-medium text-blue-700 hover:text-blue-800"
              >
                Upload a document first →
              </Link>
            ) : null}
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
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                {message.role === "assistant" && message.totalTokens > 0 ? (
                  <p className="mt-2 text-xs text-slate-500">
                    {message.totalTokens.toLocaleString()} tokens
                  </p>
                ) : null}
              </div>
            </div>
          ))
        )}
        {loading ? (
          <p className="text-center text-sm text-slate-500">Assistant is thinking...</p>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 border-t border-slate-200 bg-slate-50 py-4"
      >
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <label htmlFor="document" className={labelClass}>
              Document context (optional)
            </label>
            <select
              id="document"
              value={selectedDocumentId}
              onChange={(event) => setSelectedDocumentId(event.target.value)}
              className={inputClass}
            >
              <option value="">No document — general chat</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.originalName}
                </option>
              ))}
            </select>
            {documents.length === 0 ? (
              <p className="mt-1.5 text-xs text-slate-500">
                No documents yet.{" "}
                <Link href="/upload" className="font-medium text-blue-700 hover:underline">
                  Upload one
                </Link>
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="message" className={labelClass}>
              Your message
            </label>
            <textarea
              id="message"
              rows={3}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type your question here..."
              className={`${inputClass} resize-none`}
              disabled={loading}
            />
          </div>

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
  );
}
