export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-4 rounded-lg border p-6">
        <h1 className="text-xl font-semibold">Knowledge Assistant</h1>
        <p className="text-sm text-gray-500">
          Mock user: admin / admin123
        </p>
        {/* TODO: login form → POST /api/auth/login */}
        <p className="text-sm text-amber-600">Login — ยังไม่ implement</p>
      </div>
    </main>
  );
}
