"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Button } from "./ui/button";
export function AuthStatus() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const client = createClient();
    let active = true;
    let authEventReceived = false;
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      authEventReceived = true;
      if (active) setSignedIn(Boolean(session));
    });
    client.auth.getUser().then(({ data }) => {
      if (active && !authEventReceived) setSignedIn(Boolean(data.user));
    }).catch(() => {
      if (active && !authEventReceived) setSignedIn(false);
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  async function logout() {
    setBusy(true); setMessage("");
    try { const { error } = await createClient().auth.signOut(); if (error) throw error; setSignedIn(false); router.replace("/login"); router.refresh(); }
    catch { setMessage("Chưa đăng xuất được, vui lòng thử lại."); }
    // The root layout persists across navigation, so clear this on success too.
    finally { setBusy(false); }
  }
  return <div>{signedIn ? <Button type="button" onClick={logout} disabled={busy}>{busy ? "Đang đăng xuất…" : "Đăng xuất"}</Button> : <Link href="/login" className="text-sm font-semibold text-teal-800">Đăng nhập</Link>}{message && <p role="alert" className="text-sm text-red-700">{message}</p>}</div>;
}
