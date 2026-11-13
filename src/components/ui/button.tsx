import type { ComponentProps } from "react";
export function Button({ className = "", type = "submit", ...props }: ComponentProps<"button">) {
  return <button type={type} className={`inline-flex items-center justify-center rounded-lg bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />;
}
