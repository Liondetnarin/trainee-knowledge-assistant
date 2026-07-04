import { AppNav } from "@/components/AppNav";
import { UploadForm } from "@/components/UploadForm";

export default function UploadPage() {
  return (
    <>
      <AppNav />
      <main className="mx-auto max-w-3xl p-8">
        <h1 className="mb-6 text-xl font-semibold text-gray-900">Upload Document</h1>
        <UploadForm />
      </main>
    </>
  );
}
