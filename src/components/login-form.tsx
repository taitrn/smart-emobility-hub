"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Brand } from "@/components/app-shell";
import { PageHeading } from "@/components/ui/workspace";
import { ReservationIcon } from "@/features/reservations/reservation-ui";

export function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email: String(form.get("email")).trim(), password: String(form.get("password")) });
      if (error) { setMessage("Không thể đăng nhập. Kiểm tra email, mật khẩu và trạng thái tài khoản."); return; }
      const response = await fetch("/api/me", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) { await supabase.auth.signOut(); setMessage(result.error?.message ?? "Chưa đọc được hồ sơ tài khoản."); return; }
      router.replace(result.data.role === "OPERATOR" ? "/operator" : "/hubs"); router.refresh();
    } catch { setMessage("Chưa kết nối được dịch vụ đăng nhập. Kiểm tra cấu hình hoặc thử lại."); }
    finally { setBusy(false); }
  }
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[5fr_7fr]">
      <section className="flex flex-col justify-between gap-8 border-b border-[#dce7df] bg-[#edf5ef] px-6 py-6 sm:px-12 lg:border-r lg:border-b-0 lg:py-10">
        <Brand />
        <div className="max-w-md space-y-5">
          <h2 className="text-2xl font-bold text-[#153f34] lg:text-3xl">Đặt xe dùng chung nhanh hơn</h2>
          <p className="app-muted">Tra cứu xe tại các Hub trong khu đô thị ĐHQG-HCM và giữ xe trước khi đến nhận.</p>
          <ul className="hidden space-y-3 text-sm font-semibold lg:block">
            <li className="flex items-center gap-2"><ReservationIcon name="pin" /> Tra cứu Hub và xe khả dụng</li>
            <li className="flex items-center gap-2"><ReservationIcon name="calendar" /> Giữ xe trong 15 phút</li>
            <li className="flex items-center gap-2"><ReservationIcon name="key" /> Nhận xe tại Hub bằng mã đặt</li>
          </ul>
        </div>
        <p className="app-muted hidden lg:block">VNU-HCM - Smart E-Mobility Hub</p>
      </section>
      <section className="grid place-items-center bg-white px-6 py-10">
        <div className="w-full max-w-sm space-y-5">
          <PageHeading title="Đăng nhập" description="Sử dụng tài khoản demo do nhóm cung cấp." />
          <Card>
            <form onSubmit={login} className="space-y-4">
              <label className="app-field">Email<Input name="email" type="email" autoComplete="username" required disabled={busy} /></label>
              <label className="app-field">Mật khẩu<Input name="password" type="password" autoComplete="current-password" required disabled={busy} /></label>
              {message && <p role="alert" className="app-error">{message}</p>}
              <Button disabled={busy} className="w-full">{busy ? "Đang đăng nhập…" : "Đăng nhập"}</Button>
            </form>
          </Card>
        </div>
      </section>
    </div>
  );
}
