import { FeaturePlaceholder } from "@/components/feature-placeholder";

export default function ParkingPage() {
  return <FeaturePlaceholder title="Đặt chỗ đỗ cá nhân" useCase="UC05 · Student" description="Đặt slot PRIVATE cho xe cá nhân theo khoảng thời gian." requirements={[
    "Khoảng đặt ít nhất 30 phút, không ở quá khứ và không chồng lịch.",
    "Lịch đặt tương lai không thay đổi occupancy hiện tại.",
    "Check-in, check-out qua simulator có quyền; không làm cơ chế phạt no-show.",
  ]} />;
}
