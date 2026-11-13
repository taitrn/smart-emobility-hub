import { FeaturePlaceholder } from "@/components/feature-placeholder";

export default function ChargingPage() {
  return <FeaturePlaceholder title="Yêu cầu sạc xe" useCase="UC06 · Student" description="Gửi yêu cầu và theo dõi phiên sạc mô phỏng của mình." requirements={[
    "Chọn xe, Hub và giờ rời dự kiến; hệ thống cấp cổng phù hợp.",
    "Hiển thị WAITING, CHARGING, COMPLETED và kết quả phiên sạc từ server.",
    "Không cho người dùng tự ghi mức ưu tiên hoặc trạng thái cổng.",
  ]} />;
}
