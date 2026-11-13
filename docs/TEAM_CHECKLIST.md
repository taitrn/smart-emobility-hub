# Việc của nhóm

Mục tiêu: triển khai và demo MVP theo [phạm vi](implementation/01_SCOPE_AND_RULES.md). Các feature service vẫn là stub. Auth/data cần áp SQL và kiểm tra theo [AUTH_SETUP](AUTH_SETUP.md). Nhánh nhóm sẽ được tạo sau khi chốt nền; PR về main theo [CONTRIBUTING](CONTRIBUTING.md).

## Tài — nền dùng chung và UC01

- [ ] `supabase/`, `src/lib/supabase/`, `src/lib/auth/require-actor.ts`, trang login: Auth demo, profile/role, RLS, seed Hub/tài nguyên và kiểm tra quyền cơ bản.
- [ ] `src/features/hubs/service.ts`, `/api/hubs`, trang hubs: list/detail, pin, chỗ/cổng và loading/error.
- [ ] Ghép PR, cấu hình Vercel khi local chạy, hướng dẫn seed/demo. Không dựng hết schema trước.

## Tiến — UC02/07

- [ ] `src/features/reservations/vehicle.ts`, API/trang reservations: đặt, xem, hủy, mã nhận và hạn giữ.
- [ ] Thêm bảng lượt đặt xe và kiểm tra phía server; hai người không đặt được cùng xe. Không làm receipt/retry framework.

## Toàn — UC03

- [ ] `src/features/rental/pickup.ts`, API pickup, trang nhận xe: kiểm tra chủ lượt, mã và hạn; simulator thành công mới tạo trip.
- [ ] Mã sai/lỗi thiết bị không đổi dữ liệu; bấm lại không tạo hai chuyến. Không làm pending ACK/đối soát.

## Ân — UC04

- [ ] `src/features/rental/return.ts`, API return, trang trips: chọn chỗ FLEET trống và kết thúc chuyến sau khóa mô phỏng thành công.
- [ ] Trả sai chủ/Hub đầy bị từ chối, lỗi khóa giữ nguyên chuyến. Không làm slot claim kéo dài.

## Tài tổng hợp — UC05

- [ ] `src/features/reservations/parking.ts`, API/trang parking: đặt/hủy theo giờ; kiểm tra khoảng giờ và overlap.
- [ ] Mô phỏng đến/rời cập nhật occupancy đúng; không làm phạt no-show tự động.

## Việt Anh — UC11

- [ ] `src/features/simulation/service.ts`, API/trang simulations: hàm tính thuần, kịch bản nhu cầu tăng, cổng hỏng, Hub đầy và Hub có nhiều xe nhất.
- [ ] Bảng baseline/scenario và khuyến nghị có lý do; dữ liệu live không đổi. Không làm history/export/draft approval.

## Phần hỗ trợ để demo toàn dự án

Phân công dưới đây là đề xuất phối hợp, các bạn xác nhận khi nhận việc.

- [ ] Việt Anh (owner đề xuất), Tài hỗ trợ: `src/features/charging/service.ts`, `src/app/api/charging-requests/route.ts` và UI charging; ưu tiên pin ≤20% hoặc rời trong 0–60 phút, FIFO cùng nhóm và cấp cổng. Không cần pause/resume hoặc mô phỏng công suất.
- [ ] Ân (owner đề xuất), Toàn hỗ trợ: `src/features/operations/service.ts`, `src/app/api/operator/overview/route.ts`, dashboard và nút giả lập xe/cổng lỗi, khôi phục; không làm CRUD/incident workflow.
- [ ] Cả nhóm: chạy chuỗi demo và các lỗi chính theo [mục 04](implementation/04_UI_AND_DEMO.md), tập giải thích và cập nhật Final.

Types/error/config dùng chung giữ nguyên khi chưa cần đổi. Migration thay đổi cùng feature; trao đổi trước khi sửa field chung. UI/logic thuần có thể làm song song, dữ liệu riêng tư phải chờ Auth/quyền đúng. Tích checklist khi có hành vi chạy được, không chỉ vì có tên file.
