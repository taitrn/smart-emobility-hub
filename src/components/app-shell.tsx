"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ReservationIcon } from "@/features/reservations/reservation-ui";
import { createClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { AuthStatus } from "./auth-status";

const commonNavigation = [
  ["/", "Trang chủ", "home"],
  ["/hubs", "Tra cứu Hub & xe", "pin"],
] as const;

const studentNavigation = [
  ...commonNavigation,
  ["/reservations/new", "Đặt xe dùng chung", "bike"],
  ["/trips", "Chuyến đi", "key"],
  ["/parking", "Đỗ xe cá nhân", "parking"],
  ["/charging", "Đăng ký sạc", "charge"],
  ["/reservations", "Lượt đặt của tôi", "calendar"],
] as const;

const operatorNavigation = [
  ["/operator", "Tổng quan mạng lưới", "home"],
  ["/hubs", "Giám sát Hub", "pin"],
  ["/operator/parking", "Vận hành chỗ đỗ", "parking"],
  ["/operator/charging", "Hàng đợi sạc", "charge"],
  ["/operator/simulations", "Mô phỏng What-if", "bolt"],
] as const;

type ShellRole = "STUDENT" | "OPERATOR" | null;

function useShellRole() {
  const [role, setRole] = useState<ShellRole>(null);
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const client = createClient();
    let active = true;
    let version = 0;
    const update = async () => {
      const current = ++version;
      try {
        const response = await fetch("/api/me", { cache: "no-store" });
        const data = (await response.json()).data;
        if (active && current === version) {
          setRole(data?.role === "STUDENT" || data?.role === "OPERATOR" ? data.role : null);
        }
      } catch {
        if (active && current === version) setRole(null);
      }
    };
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (session) queueMicrotask(() => { if (active) void update(); });
      else {
        version++;
        if (active) setRole(null);
      }
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  return role;
}

export function Brand() {
  return (
    <Link href="/" className="flex w-fit items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-lg bg-[#153f34]"><ReservationIcon name="bolt" /></span>
      <span className="text-sm font-bold text-[#153f34]">
        E-Mobility
        <span className="block text-xs font-normal text-[#546a60]">VNU-HCM - Smart Hub</span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const role = useShellRole();
  const operator = role === "OPERATOR";
  const navigation = operator ? operatorNavigation : role === "STUDENT" ? studentNavigation : commonNavigation;
  const active = navigation.find(([href]) => pathname === href ||
    (href === "/hubs" && pathname.startsWith("/hubs/")) ||
    (href === "/reservations" && pathname.endsWith("/pickup")));
  const title = pathname.endsWith("/pickup") ? "Nhận xe tại Hub" : active?.[1] ?? "Smart E-Mobility Hub";
  const area = operator ? "Vận hành & điều phối" : role === "STUDENT" ? "Dịch vụ sinh viên" : "Smart Mobility Hub";

  if (pathname === "/login") return <main id="main">{children}</main>;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-20 focus:bg-white focus:p-3">
        Bỏ qua điều hướng
      </a>
      <aside className="border-b border-[#dce7df] bg-white px-4 py-3 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-r lg:border-b-0 lg:py-7">
        <div className="mb-4 lg:mb-6 lg:px-2"><Brand /></div>
        {role && (
          <div className="mb-7 hidden items-center gap-3 rounded-lg bg-[#e6f2ec] px-3 py-2.5 text-sm font-semibold text-[#117052] lg:flex">
            <ReservationIcon name="student" /> {operator ? "Người vận hành" : "Sinh viên"}
          </div>
        )}
        <nav aria-label={operator ? "Điều hướng vận hành" : role ? "Điều hướng sinh viên" : "Điều hướng chính"} className="flex flex-wrap gap-1 lg:grid lg:gap-1.5">
          {navigation.map(([href, label, icon]) => (
            <Link key={href} href={href} aria-current={active?.[0] === href ? "page" : undefined}
              className="flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm hover:bg-[#f4faf7] aria-[current=page]:bg-[#e6f2ec] aria-[current=page]:font-semibold aria-[current=page]:text-[#117052] lg:gap-3.5 lg:px-3">
              <ReservationIcon name={icon} /> {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[#dce7df] bg-white px-5 py-3 lg:min-h-20 lg:px-8">
          <div>
            <p className="text-xs font-medium tracking-wide text-[#546a60] uppercase">{area}</p>
            <p className="text-base font-bold text-[#153f34]">{title}</p>
          </div>
          <AuthStatus />
        </header>
        <main id="main" className="mx-auto w-full max-w-[1440px] px-5 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
