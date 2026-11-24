import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export const primaryAction =
  "app-action";
export const secondaryAction =
  "app-secondary min-h-11 px-4";
export const dangerAction =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-[#e7c2c2] bg-white px-4 py-2.5 text-sm font-semibold text-[#a12d2d] hover:bg-[#fbeaea] disabled:cursor-not-allowed disabled:opacity-50";
export const reservationGrid = "grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start";

export function ReservationCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <Card className={`border-[#dce7df]! p-5! ${className}`}>{children}</Card>;
}

export function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5 py-3 text-sm/6">
      <dt className="text-[#546a60]">{label}</dt>
      <dd className="min-w-0 text-right break-words">{children}</dd>
    </div>
  );
}

export function ReservationError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e7c2c2] bg-[#fbeaea] px-4 py-3 text-sm text-[#872f2f]" role="alert">
      <p>{message}</p>
      {onRetry && <button type="button" className="font-semibold underline underline-offset-4" onClick={onRetry}>Thử lại</button>}
    </div>
  );
}
