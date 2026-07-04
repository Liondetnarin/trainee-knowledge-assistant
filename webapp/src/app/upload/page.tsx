import { AppNav } from "@/components/AppNav";
import { UploadForm } from "@/components/UploadForm";

export default function UploadPage() {
  return (
    <>
      <AppNav />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Upload</h1>
          <p className="mt-1 text-sm text-slate-600">
            Add PDF or TXT files, then ask questions about them in Chat.
          </p>
        </div>
        <UploadForm />
      </main>
    </>
  );
}
