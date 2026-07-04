"use client";

import { FormEvent, useEffect, useState } from "react";

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
      setError("Please choose a PDF or TXT file");
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
        `Uploaded "${data.document?.originalName}" (${data.document?.chunkCount} chunks)`,
      );
      setFile(null);
      await loadDocuments();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-6">
        <div>
          <label htmlFor="file" className="mb-1 block text-sm font-medium">
            PDF or TXT file
          </label>
          <input
            id="file"
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">Max size: 10MB</p>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {success ? <p className="text-sm text-green-600">{success}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>

      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-medium">Uploaded documents</h2>
        {documents.length === 0 ? (
          <p className="text-sm text-gray-500">No documents yet.</p>
        ) : (
          <ul className="divide-y">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{doc.originalName}</p>
                  <p className="text-gray-500">{formatSize(doc.size)}</p>
                </div>
                <span className="text-xs text-gray-400">
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
