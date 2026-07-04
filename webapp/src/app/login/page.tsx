import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Knowledge Assistant</h1>
          <p className="mt-1 text-sm text-gray-500">Mock user: admin / admin123</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
