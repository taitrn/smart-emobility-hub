import { FeaturePlaceholder } from "@/components/feature-placeholder";

export default function ChargingQueuePage() {
  return <FeaturePlaceholder title="Hàng đợi sạc" useCase="UC10 · Operator" description="Theo dõi thứ tự chờ và phân bổ cổng sạc mô phỏng." requirements={[
    "Ưu tiên pin ≤20% hoặc rời trong 0–60 phút; FIFO trong cùng nhóm.",
    "Mỗi cổng phục vụ tối đa một phiên đang sạc.",
    "Operator bấm xử lý hàng đợi hoặc hoàn tất sạc mô phỏng.",
  ]} />;
}
