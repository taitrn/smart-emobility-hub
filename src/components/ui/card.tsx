import type { ComponentProps } from "react";
export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`rounded-xl border border-slate-200 bg-white p-6 ${className}`} {...props} />;
}
