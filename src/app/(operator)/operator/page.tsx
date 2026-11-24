import Link from "next/link";
import { OperatorDashboard } from "@/features/operations/dashboard";

export default function OperatorPage() {
  return <div className="space-y-8">
    <h1 className="text-3xl font-bold">Dashboard vận hành</h1>
    <OperatorDashboard />
    <nav aria-label="Chức năng vận hành" className="flex flex-wrap gap-4 text-sm font-semibold text-teal-800">
      <Link href="/operator/parking" className="hover:underline">Parking →</Link>
      <Link href="/operator/charging" className="hover:underline">Hàng đợi sạc →</Link>
      <Link href="/operator/simulations" className="hover:underline">What-if →</Link>
    </nav>
  </div>;
}
