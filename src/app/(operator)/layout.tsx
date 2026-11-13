import type { ReactNode } from "react";
import { requirePageRole } from "@/lib/auth/page-access";
export default async function Layout({ children }: { children: ReactNode }) {
  await requirePageRole("OPERATOR");
  return children;
}
