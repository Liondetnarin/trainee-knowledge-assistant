"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const links = [
    { href: "/chat", label: "Chat" },
    { href: "/upload", label: "Upload" },
  ];

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-gray-900">Knowledge Assistant</span>
          <nav className="flex gap-4 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  pathname === link.href
                    ? "font-medium text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
