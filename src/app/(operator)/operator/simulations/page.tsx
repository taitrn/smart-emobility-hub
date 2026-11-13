import { FeaturePlaceholder } from "@/components/feature-placeholder";

export default function SimulationsPage() {
  return <FeaturePlaceholder title="What-if Simulation" useCase="UC11 · Operator" description="Thử kịch bản trên snapshot độc lập với trạng thái vận hành." requirements={[
    "Chọn Hub, nhu cầu, cổng lỗi và xe dự kiến đến; xem Hub đầy và Hub có nhiều xe nhất.",
    "Bảng baseline/scenario, metrics và khuyến nghị theo quy tắc đơn giản.",
    "Kết quả và khuyến nghị không tự thay đổi xe hoặc lịch sạc live.",
  ]} />;
}
