"use client";

import { useEffect, useRef, useState } from "react";

interface DocumentItem {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

interface DocumentSidebarProps {
  selectedDocumentId: string;
  onSelectDocument: (id: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentSidebar({
  selectedDocumentId,
  onSelectDocument,
}: DocumentSidebarProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadDocuments() {
    const response = await fetch("/api/documents");
    if (!response.ok) return;

    const data = (await response.json()) as { documents: DocumentItem[] };
    setDocuments(data.documents);
  }

  useEffect(() => {
    // setState only happens after the awaited fetch — not a synchronous cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDocuments();
  }, []);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const data = (await response.json()) as {
        error?: string;
        document?: DocumentItem;
      };

      if (!response.ok || !data.document) {
        setError(data.error ?? "Upload failed");
        return;
      }

      await loadDocuments();
      onSelectDocument(data.document.id);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(doc: DocumentItem) {
    const confirmed = window.confirm(`Delete "${doc.originalName}"?`);
    if (!confirmed) return;

    setError("");
    setDeletingId(doc.id);

    try {
      const response = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "Failed to delete document");
        return;
      }

      if (selectedDocumentId === doc.id) {
        onSelectDocument("");
      }
      await loadDocuments();
    } catch {
      setError("Failed to delete document. Please try again.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Documents
        </p>
        <label
          htmlFor="sidebar-file"
          className="cursor-pointer text-xs font-medium text-blue-700 hover:text-blue-800"
        >
          {uploading ? "Uploading..." : "+ Add"}
        </label>
        <input
          ref={fileInputRef}
          id="sidebar-file"
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          onChange={(event) => void handleFileChange(event)}
          disabled={uploading}
          className="sr-only"
        />
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <button
        type="button"
        onClick={() => onSelectDocument("")}
        className={`rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition ${
          selectedDocumentId === ""
            ? "bg-blue-50 text-blue-700"
            : "text-slate-500 hover:bg-slate-100"
        }`}
      >
        No document — general chat
      </button>

      {documents.length === 0 ? (
        <p className="px-2.5 text-xs text-slate-400">No documents yet.</p>
      ) : (
        <ul className="space-y-0.5">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className={`group flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs transition ${
                selectedDocumentId === doc.id
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectDocument(doc.id)}
                className="min-w-0 flex-1 truncate text-left font-medium"
                title={`${doc.originalName} · ${formatSize(doc.size)}`}
              >
                {doc.originalName}
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(doc)}
                disabled={deletingId === doc.id}
                className="shrink-0 rounded px-1 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 disabled:opacity-50"
                aria-label={`Delete ${doc.originalName}`}
              >
                {deletingId === doc.id ? "…" : "✕"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
