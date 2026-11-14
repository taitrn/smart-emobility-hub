import Link from "next/link";
import { FeaturePlaceholder } from "@/components/feature-placeholder";

export default function OperatorPage() {
  return <div className="space-y-8">
    <FeaturePlaceholder title="Dashboard vận hành" useCase="UC08 / UC12 · Operator" description="Theo dõi ba Hub demo và giả lập sự cố." requirements={[
      "Server kiểm tra role Operator trước thao tác vận hành.",
      "Xem xe/chỗ/cổng; giả lập xe hoặc cổng lỗi và khôi phục.",
      "Refresh sau thao tác; chưa cần tick hoặc worker nền.",
    ]} />
    <nav aria-label="Chức năng vận hành" className="flex flex-wrap gap-4 text-sm font-semibold text-teal-800">
      <Link href="/operator/parking" className="hover:underline">Parking →</Link>
      <Link href="/operator/charging" className="hover:underline">Hàng đợi sạc →</Link>
      <Link href="/operator/simulations" className="hover:underline">What-if →</Link>
    </nav>
  </div>;
}
