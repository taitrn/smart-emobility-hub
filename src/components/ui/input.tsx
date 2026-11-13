import type { ComponentProps } from "react";
export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input className={`mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 disabled:opacity-50 ${className}`} {...props} />;
}
