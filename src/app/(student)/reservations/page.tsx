import { FeaturePlaceholder } from "@/components/feature-placeholder";

export default function ReservationsPage() {
  return <FeaturePlaceholder title="Lượt đặt của tôi" useCase="UC02 / UC03 / UC07 · Student" description="Lượt đặt xe, mã nhận và thao tác hủy của người dùng đã đăng nhập." requirements={[
    "Giữ một xe trong 15 phút, chống đặt trùng tại database.",
    "Mã nhận chỉ hiển thị cho chủ lượt còn hiệu lực; nhận xe mô phỏng kết quả ngay.",
    "Hủy hợp lệ và cập nhật trạng thái từ server, không xác nhận thành công chỉ bằng UI.",
  ]} />;
}
