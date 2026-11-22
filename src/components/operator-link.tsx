"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/config";
export function OperatorLink() {
  const onLoginPage = usePathname() === "/login";
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let alive = true;
    let generation = 0;
    const update = () => {
      const g = ++generation;
      void fetch("/api/me", { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => {
          if (alive && g === generation)
            setVisible(j.ok && j.data.role === "OPERATOR");
        })
        .catch(() => {
          if (alive) setVisible(false);
        });
    };
    const db = createClient();
    const {
      data: { subscription },
    } = db.auth.onAuthStateChange(() => queueMicrotask(update));
    update();
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [onLoginPage]);
  return visible ? (
    <Link href="/operator" className="hover:text-teal-800 hover:underline">
      Operator
    </Link>
  ) : (
    <Link href="/parking" className="hover:text-teal-800 hover:underline">Chỗ đỗ</Link>
  );
}
