import type { ComponentProps } from "react";
export function Button({ className = "", type = "submit", ...props }: ComponentProps<"button">) {
  return <button type={type} className={`app-action ${className}`} {...props} />;
}
