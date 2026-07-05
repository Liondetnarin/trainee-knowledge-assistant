"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { buttonSecondaryClass } from "@/components/ui/classes";

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
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-4 sm:gap-8">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900">
              Knowledge Assistant
            </p>
            <p className="hidden text-xs text-slate-500 sm:block">
              Ask AI with optional document context
            </p>
          </div>
          <nav className="flex rounded-lg bg-slate-100 p-1">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <button type="button" onClick={handleLogout} className={buttonSecondaryClass}>
          Logout
        </button>
      </div>
    </header>
  );
}
