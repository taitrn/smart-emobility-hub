"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReservationIcon } from "@/features/reservations/reservation-ui";
import { OperatorLink } from "./operator-link";
import { AuthStatus } from "./auth-status";
import type { ReactNode } from "react";

const navigation = [
  ["/hubs", "Mobility Hub"],
  ["/reservations", "Lượt đặt"],
  ["/trips", "Chuyến đi"],
  ["/charging", "Sạc xe"],
] as const;

const studentNavigation = [
  ["/", "Trang chủ", "home"],
  ["/hubs", "Tra cứu Hub & xe", "pin"],
  ["/reservations/new", "Đặt xe dùng chung", "bike"],
  ["/trips", "Chuyến đi", "key"],
  ["/parking", "Đỗ xe cá nhân", "parking"],
  ["/charging", "Đăng ký sạc", "charge"],
  ["/reservations", "Lượt đặt của tôi", "calendar"],
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/reservations" || pathname === "/reservations/new") {
    return (
      <div className="min-h-screen bg-[#f5f8f5] font-['Noto_Sans_Variable',Arial,sans-serif] text-[#172d25] lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-20 focus:bg-white focus:p-3">
          Bỏ qua điều hướng
        </a>
        <aside className="border-b border-[#dce7df] bg-white px-4 py-3 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-r lg:border-b-0 lg:py-7">
          <Link href="/" className="mb-4 flex w-fit items-center gap-2.5 lg:mb-6 lg:px-2">
            <span className="grid size-8 place-items-center rounded-lg bg-[#153f34]"><ReservationIcon name="bolt" /></span>
            <span className="text-sm font-bold text-[#153f34]">
              E-Mobility
              <span className="block text-xs font-normal text-[#546a60]">VNU-HCM · Smart Hub</span>
            </span>
          </Link>
          <div className="mb-7 hidden items-center gap-3 rounded-lg bg-[#e6f2ec] px-3 py-2.5 text-sm font-semibold text-[#117052] lg:flex">
            <ReservationIcon name="student" /> Sinh viên
          </div>
          <nav aria-label="Điều hướng sinh viên" className="flex flex-wrap gap-1 lg:grid lg:gap-1.5">
            {studentNavigation.map(([href, label, icon]) => (
              <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}
                className="flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm hover:bg-[#f4faf7] aria-[current=page]:bg-[#e6f2ec] aria-[current=page]:font-semibold aria-[current=page]:text-[#117052] lg:gap-3.5 lg:px-3">
                <ReservationIcon name={icon} />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0">
          <header className="flex min-h-16 flex-wrap items-center justify-between gap-y-2 gap-x-4 border-b border-[#dce7df] bg-white px-5 py-3 lg:min-h-20 lg:px-8">
            <div>
              <p className="text-xs font-medium tracking-wide text-[#546a60] uppercase">Dịch vụ sinh viên</p>
              <p className="text-base font-bold text-[#153f34]">{pathname === "/reservations/new" ? "Đặt xe dùng chung" : "Lượt đặt của tôi"}</p>
            </div>
            <AuthStatus />
          </header>
          <main id="main" className="mx-auto w-full max-w-[1440px] px-5 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    );
  }

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
