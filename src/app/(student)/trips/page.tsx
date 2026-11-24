import { FeaturePlaceholder } from "@/components/feature-placeholder";

export default function TripsPage() {
  return <FeaturePlaceholder title="Chuyến đi của tôi" useCase="UC04 · Student" description="Theo dõi chuyến đang hoạt động và xác nhận trả xe." requirements={[
    "Chỉ đọc trip của chính người dùng.",
    "Trả vào slot FLEET hoạt động và trống; báo lỗi khi Hub đầy.",
    "Chỉ hoàn tất trip sau khi giả lập khóa thành công; mô phỏng lỗi thì giữ nguyên chuyến.",
  ]} />;
}
