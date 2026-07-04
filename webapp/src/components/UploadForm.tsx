"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  alertErrorClass,
  alertSuccessClass,
  buttonPrimaryClass,
  cardClass,
  labelClass,
} from "@/components/ui/classes";

interface DocumentItem {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadForm() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  async function loadDocuments() {
    const response = await fetch("/api/documents");
    if (!response.ok) return;

    const data = (await response.json()) as { documents: DocumentItem[] };
    setDocuments(data.documents);
  }

  useEffect(() => {
    void loadDocuments();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!file) {
      setError("Please choose a PDF or TXT file first.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        error?: string;
        document?: { originalName: string; chunkCount: number };
      };

      if (!response.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }

      setSuccess(
        `Uploaded "${data.document?.originalName}" (${data.document?.chunkCount} chunks). You can now use it in Chat.`,
      );
      setFile(null);
      setInputKey((value) => value + 1);
      await loadDocuments();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className={`${cardClass} space-y-5`}>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Upload a document</h2>
          <p className="mt-1 text-sm text-slate-500">
            Supported: PDF or TXT, up to 10MB. Text is chunked for chat context.
          </p>
        </div>

        <div>
          <label htmlFor="file" className={labelClass}>
            Choose file
          </label>
          <label
            htmlFor="file"
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50/40"
          >
            <span className="text-sm font-medium text-slate-800">
              {file ? file.name : "Click to browse or drop a file here"}
            </span>
            <span className="mt-1 text-xs text-slate-500">PDF or TXT only</span>
            <input
              key={inputKey}
              id="file"
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="sr-only"
            />
          </label>
        </div>

        {error ? <p className={alertErrorClass}>{error}</p> : null}
        {success ? (
          <div className="space-y-2">
            <p className={alertSuccessClass}>{success}</p>
            <Link
              href="/chat"
              className="inline-flex text-sm font-medium text-blue-700 hover:text-blue-800"
            >
              Go to Chat →
            </Link>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading || !file}
          className={buttonPrimaryClass}
        >
          {loading ? "Uploading..." : "Upload document"}
        </button>
      </form>

      <section className={cardClass}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Your documents</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {documents.length} file{documents.length === 1 ? "" : "s"}
          </span>
        </div>

        {documents.length === 0 ? (
          <p className="text-sm text-slate-500">No documents uploaded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">{doc.originalName}</p>
                  <p className="text-sm text-slate-500">
                    {formatSize(doc.size)} · {doc.mimeType || "unknown type"}
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(doc.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
