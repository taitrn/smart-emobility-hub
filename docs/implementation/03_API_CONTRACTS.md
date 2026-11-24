# 03 API tối thiểu

## Dùng chung

Các route dùng Zod và envelope `ok/data/error/requestId`. Lỗi thường gặp: 400 input sai, 401/403 session hoặc quyền, 404 không tìm thấy, 409 xung đột trạng thái, 503 lỗi thiết bị mô phỏng hoặc thiếu kết nối/cấu hình.

ID UUID, thời gian ISO 8601, JSON camelCase. `requestId` dùng để theo dõi. Đặt xe, parking và sạc có xử lý retry riêng. Không nhận actorId/role từ body. API lấy user thật từ session.

## Route hiện có

Các path dưới đây có tiền tố `/api`.

| Route | Chức năng |
|---|---|
| GET /hubs; GET /hubs/{id} | Public danh sách/chi tiết tài nguyên, không có lượt đặt của người khác |
| GET /health | Đã chạy: 200 liveness, không kiểm tra DB |
| GET /me | Đã chạy: id, role, hubIds=[]; chưa login trả 401. Operator không dùng hubIds để giới hạn Hub trong MVP |
| GET /me/reservations | Lượt đặt của chính Student. Trang chuyến đi đọc từ service phía server |
| POST /vehicle-reservations | vehicleId, requestId → lượt đặt + mã nhận + hạn giữ xe |
| POST /vehicle-reservations/{id}/cancel | requestId → lượt đã hủy |
| POST /vehicle-reservations/{id}/pickup | pickupCode, requestId → kết quả simulator và trip |
| POST /trips/{id}/return | hubId, slotId, requestId → kết quả simulator và trip |
| GET /parking-reservations | Danh sách theo role, trạng thái và trang |
| POST /parking-reservations | privateVehicleId, slotId, start, end, requestId → lịch đã đặt |
| POST /parking-reservations/{id}/cancel | Hủy lịch của mình khi chưa check-in |
| POST /operator/parking-events | ARRIVED/DEPARTED và reservationId → cập nhật lịch/chỗ |
| GET /charging-requests | Trạng thái sạc theo quyền và bộ lọc trạng thái |
| POST /charging-requests | Xe, Hub, giờ rời dự kiến → yêu cầu chờ cấp cổng |
| GET /operator/overview | Hub/tài nguyên, hàng đợi và số liệu tổng quan |
| POST /operator/resources/{id}/status | Giả lập lỗi/khôi phục xe hoặc cổng, kiểm tra role |
| POST /operator/charging/process | Cấp cổng còn trống theo ưu tiên |
| POST /operator/charging/{id}/complete | Mô phỏng sạc xong và giải phóng cổng |
| POST /operator/simulations | Input theo schema hiện tại → baseline/scenario + khuyến nghị |

Login/logout đã dùng Supabase Auth; `/login` chuyển Student tới `/hubs`, Operator tới `/operator` khi session hợp lệ. Không thêm API Admin, receipt, device-command, tick, incident, draft, export hoặc history trong bản đầu.

## Đặt và hủy xe dùng chung

API đặt xe và view xe khả dụng của Hub dùng migration 005.

- `POST /api/vehicle-reservations` trả 201 khi tạo lượt. Cùng Student và requestId, gửi lại cùng vehicleId trả 200 với lượt cũ theo trạng thái hiện tại và hạn cũ. Dùng requestId đó cho xe khác trả 409 `REQUEST_ID_REUSED`.
- `GET /api/me/reservations` trả `data.reservations` của chính Student, mới nhất trước. DTO lượt đặt có mã xe, tên Hub, ID và mã chỗ nhận. Chỉ có `pickupCode` khi lượt vẫn còn hiệu lực. Nếu đã nhận xe, `tripId` và `tripStatus` lấy từ chuyến tương ứng.
- `POST /api/vehicle-reservations/{id}/cancel` trả 200 khi hủy thành công hoặc lượt của mình đã `CANCELLED`. Lượt ngoài quyền đọc trả 404. Lượt hết hạn trả 409 `RESERVATION_EXPIRED` và ghi nhận thu hồi. Lượt đã nhận xe trả 409 `INVALID_STATE`.
- Hub list và detail đọc cùng view khả dụng. Chi tiết trả thêm `isBookable` để chọn xe. Lượt hết hạn được xem là hết hiệu lực ngay khi đọc và được ghi nhận khi có thao tác liên quan.

## Nhận và trả

Kết quả thành công giữ `{command, trip}` theo DTO hiện có; command chỉ là kết quả giả lập của request, không cần bảng riêng. Thất bại trả lỗi và không thay đổi reservation/trip/tài nguyên. MVP không trả 202 hoặc poll ACK. Kết quả thiết bị do server xác định.

## What-if

Input gồm `hubIds`, `demandMultiplier`, `failedChargingPoints`, `projectedArrivals`, `arrivalHubId`, `horizonMinutes` và `seed`. Khi có xe dự kiến đến, Hub đích phải thuộc danh sách đã chọn. Engine là hàm tất định trên snapshot. Thời lượng dùng để quy đổi nhu cầu mẫu, 4 lượt xe và 1 lượt sạc mỗi Hub mỗi giờ. `seed` được giữ trong hợp đồng và hiện không ảnh hưởng kết quả.

Kết quả mỗi Hub có `isFleetFull`, `parkedVehicleCount` và `hasMostParkedVehicles`. Xe vượt sức chứa là số xe đến vượt chỗ FLEET trống. Xe dự kiến đến chỉ thêm ở Hub đích, giữ nguyên số xe tại các Hub khác. Đề xuất điều phối giới hạn theo xe dư và chỗ trống. Kết quả tính toán được trả trong cùng request, chưa có lưu lịch sử hoặc API chạy lại.

## Bổ sung parking

Ba mutation parking kiểm tra session/role trước khi đọc body; chưa đăng nhập trả 401 dù JSON sai. Request ID hợp lệ được dùng để tương quan response sau bước Auth. POST đặt chỗ dùng requestId theo owner: cùng payload trả kết quả ban đầu, khác payload trả 409 REQUEST_ID_REUSED. Chưa có receipt framework hoặc retry lookup API.

GET /parking-reservations hỗ trợ page (10 dòng/trang), status; chỉ trả lượt của chính Student hoặc toàn bộ cho Operator. Response bổ sung total, plate_number, owner_name và hub_name; không trả email Auth. Các trường snake_case của parking hiện giữ tương thích, còn chi tiết Hub đã đổi các khóa tài nguyên sang camelCase theo contract chung.

Parking cần migration 004 sau 002/003. Giờ form và hiển thị theo múi giờ UTC+7 trong SHARED_CONFIG. Không tự chuyển xe ra khỏi chỗ khi hết lịch; Operator vẫn xác nhận DEPARTED. No-show tự động tiếp tục ngoài MVP.
