import { FeaturePlaceholder } from "@/components/feature-placeholder";

export default function HubsPage() {
  return <FeaturePlaceholder title="Mobility Hub" useCase="UC01 · Public" description="Tra cứu tài nguyên công khai tại các Hub." requirements={[
    "Danh sách và chi tiết Hub; lọc loại xe, mức pin và trạng thái.",
    "Phân biệt chỗ FLEET trống hiện tại với lịch PRIVATE có thể đặt.",
    "Hiển thị timestamp và các trạng thái loading, empty, error.",
  ]} />;
}
