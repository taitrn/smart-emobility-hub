# Việc của nhóm

Các phần MVP đã ghép vào main. Danh sách này ghi module theo phần việc. [Demo và kiểm thử](implementation/04_UI_AND_DEMO.md) ghi các ca đã kiểm chứng.

## Tài — nền dùng chung và UC01

- [x] `supabase/`, `src/lib/supabase/`, `src/lib/auth/require-actor.ts`, trang login: Auth demo, profile/role, RLS, seed Hub/tài nguyên và kiểm tra quyền cơ bản.
- [x] `src/features/hubs/service.ts`, `/api/hubs`, trang hubs: list/detail, pin, chỗ/cổng và loading/error.
- [x] Nối Vercel, áp migration/seed và kiểm tra Auth/RLS nền.
- [x] Ghép PR nghiệp vụ. Chuẩn bị seed và luồng demo theo mục 04.

## Tiến — UC02/07

- [x] `src/features/reservations/vehicle.ts`, API/trang reservations: đặt, xem, hủy, mã nhận và hạn giữ.
- [x] Thêm bảng lượt đặt xe và kiểm tra phía server; hai người không đặt được cùng xe. Không làm receipt/retry framework.

## Toàn — UC03

- [x] `src/features/rental/pickup.ts`, API pickup, trang nhận xe: kiểm tra chủ lượt, mã và hạn; simulator thành công mới tạo trip.
- [x] Mã sai/lỗi thiết bị không đổi dữ liệu; bấm lại không tạo hai chuyến. Không làm pending ACK/đối soát.

## Ân — UC04

- [x] `src/features/rental/return.ts`, API return, trang trips: chọn chỗ FLEET trống và kết thúc chuyến sau khóa mô phỏng thành công.
- [x] Trả sai chủ/Hub đầy bị từ chối, lỗi khóa giữ nguyên chuyến. Không làm slot claim kéo dài.

## Tài tổng hợp — UC05

- [x] `src/features/reservations/parking.ts`, API/trang parking: đặt/hủy theo giờ; kiểm tra khoảng giờ và overlap.
- [x] Mô phỏng đến/rời cập nhật occupancy đúng; không làm phạt no-show tự động.

## Việt Anh — UC11

- [x] `src/features/simulation/service.ts`, API/trang simulations: hàm tính thuần, kịch bản nhu cầu tăng, cổng hỏng, Hub đầy và Hub có nhiều xe nhất.
- [x] Bảng baseline/scenario và khuyến nghị có lý do; dữ liệu live không đổi. Không làm history/export/draft approval.

## Phần hỗ trợ để demo toàn dự án

Tên người ở phần hỗ trợ ghi theo phân công đề xuất.

- [x] Việt Anh (owner đề xuất), Tài hỗ trợ: `src/features/charging/service.ts`, `src/app/api/charging-requests/route.ts` và UI charging; ưu tiên pin ≤20% hoặc rời trong 0–60 phút, FIFO cùng nhóm và cấp cổng. Không cần pause/resume hoặc mô phỏng công suất.
- [x] Ân (owner đề xuất), Toàn hỗ trợ: `src/features/operations/service.ts`, `src/app/api/operator/overview/route.ts`, dashboard và nút giả lập xe/cổng lỗi, khôi phục; không làm CRUD/incident workflow.
- [ ] Cả nhóm: chạy chuỗi demo và các lỗi chính theo [mục 04](implementation/04_UI_AND_DEMO.md), tập giải thích và cập nhật Final.

Types/error/config dùng chung giữ nguyên khi chưa cần đổi. Migration thay đổi cùng feature; trao đổi trước khi sửa field chung. UI/logic thuần có thể làm song song, feature có dữ liệu riêng tư phải kiểm tra ownership/RLS của bảng mới. Tích checklist khi có hành vi chạy được, không chỉ vì có tên file.
