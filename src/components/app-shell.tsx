import Link from "next/link";
import { OperatorLink } from "./operator-link";
import { AuthStatus } from "./auth-status";
import type { ReactNode } from "react";

const navigation = [
  ["/hubs", "Mobility Hub"],
  ["/reservations", "Lượt đặt"],
  ["/trips", "Chuyến đi"],
  ["/charging", "Sạc xe"],
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:p-3">
        Bỏ qua điều hướng
      </a>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-teal-800"
          >
            Smart E-Mobility Hub
          </Link>
          <AuthStatus />
          <nav
            aria-label="Điều hướng chính"
            className="flex w-full flex-wrap gap-x-5 gap-y-3 text-sm text-slate-600"
          >
            {navigation.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="hover:text-teal-800 hover:underline"
              >
                {label}
              </Link>
            ))}
            <OperatorLink />
          </nav>
        </div>
      </header>
      <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-center text-sm text-amber-950">
        Bản phát triển: các chức năng nghiệp vụ đang được triển khai.
      </div>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
        {children}
      </main>
      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">
        Software Engineering · HK261 · Nhóm L02_1
      </footer>
    </div>
  );
}
