import Image from "next/image";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

const icons = {
  bike: [20, 20],
  bolt: [16, 16],
  calendar: [20, 20],
  charge: [20, 20],
  home: [16, 16.2],
  key: [17.6654, 17.6651],
  parking: [20, 20],
  pin: [14.3333, 17.6667],
  student: [14.625, 15.875],
} as const;

export function ReservationIcon({ name }: { name: keyof typeof icons }) {
  const [width, height] = icons[name];
  return (
    <span className="inline-grid size-5 shrink-0 place-items-center" aria-hidden="true">
      <Image
        src={`/reservations/${name}.svg`}
        width={Math.round(width)}
        height={Math.round(height)}
        style={{ width, height: "auto" }}
        alt=""
        unoptimized
      />
    </span>
  );
}

export const primaryAction =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-[#147a59] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0f6348] disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryAction =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-[#c5d3cb] bg-white px-4 py-2.5 text-sm font-semibold text-[#153f34] hover:bg-[#f4faf7] disabled:cursor-not-allowed disabled:opacity-50";
export const dangerAction =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-[#e7c2c2] bg-white px-4 py-2.5 text-sm font-semibold text-[#a12d2d] hover:bg-[#fbeaea] disabled:cursor-not-allowed disabled:opacity-50";
export const reservationGrid = "grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start";

export function ReservationCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <Card className={`border-[#dce7df]! p-5! ${className}`}>{children}</Card>;
}

export function ReservationHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-1.5">
      <h1 className="text-[26px] leading-8 font-bold text-[#153f34]">{title}</h1>
      {description && <p className="text-sm/6 text-[#546a60]">{description}</p>}
    </div>
  );
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
