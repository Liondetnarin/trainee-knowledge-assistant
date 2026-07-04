import { LoginForm } from "@/components/LoginForm";
import { cardClass } from "@/components/ui/classes";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className={`w-full max-w-md ${cardClass}`}>
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">Knowledge Assistant</h1>
          <p className="text-sm text-slate-600">
            Sign in to chat with AI and upload documents for context.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
