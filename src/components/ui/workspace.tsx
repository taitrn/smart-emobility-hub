import type { ReactNode } from "react";

export function PageHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-1.5">
      <h1 className="text-[26px] leading-8 font-bold text-[#153f34]">{title}</h1>
      {description && <p className="app-muted">{description}</p>}
    </div>
  );
}

export function Metric({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="app-surface flex flex-col justify-between gap-2">
      <dt className="app-muted">{label}</dt>
      <dd className="text-2xl font-bold tabular-nums text-[#153f34]">{children}</dd>
    </div>
  );
}

const labels: Record<string, string> = {
  ACTIVE: "Hoạt động", AVAILABLE: "Sẵn sàng", FREE: "Còn trống",
  OCCUPIED: "Có xe", IN_USE: "Đang sử dụng", RESERVED: "Đang giữ",
  WAITING_CHARGE: "Chờ sạc", WAITING: "Đang chờ", CHARGING: "Đang sạc",
  COMPLETED: "Đã hoàn tất", CONFIRMED: "Đã đặt", CHECKED_IN: "Đã vào chỗ",
  CANCELLED: "Đã hủy", FAILED: "Thất bại", OUT_OF_SERVICE: "Ngừng hoạt động",
  MAINTENANCE: "Bảo trì", HIGH: "Ưu tiên cao", NORMAL: "Thông thường",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = ["OUT_OF_SERVICE", "MAINTENANCE", "FAILED"].includes(status)
    ? "bg-[#fbeaea] text-[#872f2f]"
    : ["WAITING", "WAITING_CHARGE", "RESERVED", "HIGH"].includes(status)
      ? "bg-amber-50 text-amber-900"
      : ["ACTIVE", "AVAILABLE", "FREE", "CHARGING", "CONFIRMED"].includes(status)
        ? "bg-[#e6f2ec] text-[#117052]"
        : "bg-[#eef3ef] text-[#485d54]";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{labels[status] ?? status}</span>;
}
