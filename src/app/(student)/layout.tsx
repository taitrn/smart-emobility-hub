import type { ReactNode } from "react";
import { requirePageRole } from "@/lib/auth/page-access";
export const dynamic = "force-dynamic";
export default async function Layout({ children }: { children: ReactNode }) {
  await requirePageRole("STUDENT");
  return children;
}
