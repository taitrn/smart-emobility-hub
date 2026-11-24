# Feature modules

Nghiệp vụ được chia theo module. Mỗi API lấy actor từ session. Service và RPC giữ kiểm tra ownership và RLS cho dữ liệu riêng tư. [Checklist](../../docs/TEAM_CHECKLIST.md) liệt kê các phần đã ghép.

| File/module | Phần việc |
|---|---|
| hubs/service.ts | UC01 - Tài |
| reservations/vehicle.ts | UC02/07 - Tiến |
| reservations/parking.ts | UC05 - Tài tổng hợp |
| rental/pickup.ts | UC03 - Toàn |
| rental/return.ts | UC04 - Ân |
| simulation/service.ts | UC11 - Việt Anh |
| charging/service.ts | UC06/10 - Việt Anh, Tài hỗ trợ (đề xuất) |
| operations/service.ts | Dashboard/giả lập lỗi và khôi phục - Ân, Toàn hỗ trợ (đề xuất) |

Dùng type chung tại `src/lib/domain/types.ts` và envelope tại `src/lib/http/response.ts`.
Xem [API contracts](../../docs/implementation/03_API_CONTRACTS.md) khi sửa API.
