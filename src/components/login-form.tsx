"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

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
  return <section className="mx-auto max-w-md space-y-6">
    <h1 className="text-3xl font-bold">Đăng nhập</h1>
    <p className="text-sm text-slate-600">Sử dụng tài khoản demo do nhóm cung cấp.</p>
    <Card><form onSubmit={login} className="space-y-5">
      <label className="block text-sm font-medium">Email<Input name="email" type="email" autoComplete="username" required disabled={busy} /></label>
      <label className="block text-sm font-medium">Mật khẩu<Input name="password" type="password" autoComplete="current-password" required disabled={busy} /></label>
      {message && <p role="alert" className="text-sm text-red-700">{message}</p>}
      <Button disabled={busy} className="w-full">{busy ? "Đang đăng nhập…" : "Đăng nhập"}</Button>
    </form></Card>
  </section>;
}
