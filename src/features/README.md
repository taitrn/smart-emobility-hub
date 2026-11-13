# Feature modules

Sáu UC chính có entry typed stub trên `main`. Không dựng service cho từng lớp/method trong diagram. Mỗi owner điền file được ghi trong [TEAM_CHECKLIST](../../docs/TEAM_CHECKLIST.md); sạc và dashboard cũng đã có stub. Nền Auth đã ghép; ownership và RLS của bảng nghiệp vụ thêm cùng feature.

| File/module | Phần việc |
|---|---|
| hubs/service.ts | UC01 · Tài |
| reservations/vehicle.ts | UC02/07 · Tiến |
| reservations/parking.ts | UC05 · Tài tổng hợp |
| rental/pickup.ts | UC03 · Toàn |
| rental/return.ts | UC04 · Ân |
| simulation/service.ts | UC11 · Việt Anh |
| charging/service.ts | UC06/10 · Việt Anh, Tài hỗ trợ (đề xuất) |
| operations/service.ts | Dashboard/giả lập lỗi và khôi phục · Ân, Toàn hỗ trợ (đề xuất) |

Dùng type chung tại `src/lib/domain/types.ts` và envelope tại `src/lib/http/response.ts`.
Các đề xuất phối hợp chưa được ghi nhận là từng thành viên đã nhận việc.
Xem chi tiết `docs/implementation/05_WORK_PLAN.md` và contract mục 03 trước khi thêm API.
