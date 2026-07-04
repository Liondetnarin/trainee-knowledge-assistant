"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

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
      setMessages(chatData.messages);
      setSessionTotalTokens(chatData.sessionTotalTokens);
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
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          documentId: selectedDocumentId || null,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        reply?: string;
        totalTokens?: number;
        sessionTotalTokens?: number;
      };

      if (!response.ok) {
        setError(data.error ?? "Chat request failed");
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
    } catch {
      setError("Unable to reach AI service. Please try again.");
      setMessages((prev) => prev.filter((item) => item.id !== optimisticUserMessage.id));
      setInput(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="border-b bg-gray-50 px-6 py-3 text-sm text-gray-700">
        Session total tokens: <strong>{sessionTotalTokens.toLocaleString()}</strong>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500">
            Ask a question. Select a document to chat with uploaded file context.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-3xl rounded-lg px-4 py-3 text-sm ${
                message.role === "user"
                  ? "ml-auto bg-blue-600 text-white"
                  : "bg-white border text-gray-900"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.role === "assistant" && message.totalTokens > 0 ? (
                <p className="mt-2 text-xs opacity-70">
                  Tokens: {message.totalTokens.toLocaleString()}
                </p>
              ) : null}
            </div>
          ))
        )}
        {loading ? (
          <p className="text-sm text-gray-500">Waiting for AI response...</p>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t bg-white px-6 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          <select
            value={selectedDocumentId}
            onChange={(event) => setSelectedDocumentId(event.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">No document context</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.originalName}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type your question..."
              className="flex-1 rounded-md border px-3 py-2 text-sm"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              Send
            </button>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      </form>
    </div>
  );
}
