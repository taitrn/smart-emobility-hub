import Link from "next/link";
import { OperatorDashboard } from "@/features/operations/dashboard";
import { PageHeading } from "@/components/ui/workspace";

export default function OperatorPage() {
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <PageHeading title="Tổng quan mạng lưới" description="Giám sát tài nguyên và xử lý sự cố tại các Mobility Hub." />
      <Link href="/operator/simulations" className="app-action">Mô phỏng What-if</Link>
    </div>
    <OperatorDashboard />
  </div>;
}
