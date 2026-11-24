# 03 API tối thiểu

## Dùng chung

Giữ các route/service hiện có trên `main`, Zod validation và envelope `ok/data/error/requestId`. Service chưa triển khai vẫn trả 501; không trả thành công giả. Input sai trả 400; đăng nhập/quyền là 401/403; tài nguyên không có là 404; xung đột trạng thái là 409; lỗi giả lập thiết bị là 503.

ID UUID, thời gian ISO 8601, JSON camelCase. Mutation giữ field requestId theo scaffold để theo dõi thao tác, chưa yêu cầu lưu receipt hoặc API tra cứu kết quả retry. Không nhận actorId/role từ body. API lấy user thật từ session.

## Route cần làm cùng feature

Các path dưới đây có tiền tố `/api`. `GET /health` và `GET /me` đã hoạt động. Route chưa có service nghiệp vụ trả 501 sau validation/Auth.

| Route | Chức năng |
|---|---|
| GET /hubs; GET /hubs/{id} | Public danh sách/chi tiết tài nguyên, không có lượt đặt của người khác |
| GET /health | Đã chạy: 200 liveness, không kiểm tra DB |
| GET /me | Đã chạy: id, role, hubIds=[]; chưa login trả 401. Operator không dùng hubIds để giới hạn Hub trong MVP |
| GET /me/reservations; GET /me/trips | Dữ liệu của chính người dùng |
| POST /vehicle-reservations | vehicleId, requestId → lượt đặt + mã nhận + hạn giữ xe |
| POST /vehicle-reservations/{id}/cancel | requestId → lượt đã hủy |
| POST /vehicle-reservations/{id}/pickup | pickupCode, requestId → kết quả simulator và trip |
| POST /trips/{id}/return | hubId, slotId, requestId → kết quả simulator và trip |
| POST /parking-reservations | privateVehicleId, slotId, start, end, requestId → lịch đã đặt |
| POST /parking-reservations/{id}/cancel | Hủy lịch của mình khi chưa check-in |
| POST /operator/parking-events | ARRIVED/DEPARTED và reservationId → cập nhật lịch/chỗ |
| POST /charging-requests | Xe, Hub, giờ rời dự kiến → yêu cầu chờ hoặc đã cấp cổng |
| GET /operator/overview | Hub/tài nguyên, hàng đợi và số liệu tổng quan |
| POST /operator/resources/{id}/status | Giả lập lỗi/khôi phục xe hoặc cổng, kiểm tra role |
| POST /operator/charging/process | Cấp cổng còn trống theo ưu tiên |
| POST /operator/charging/{id}/complete | Mô phỏng sạc xong và giải phóng cổng |
| POST /operator/simulations | Input theo schema hiện tại → baseline/scenario + khuyến nghị |

Login/logout đã dùng Supabase Auth; `/login` chuyển Student tới `/hubs`, Operator tới `/operator` khi session hợp lệ. Không thêm API Admin, receipt, device-command, tick, incident, draft, export hoặc history trong bản đầu. Input/output cụ thể của phần hỗ trợ chốt khi viết feature; không mở thêm endpoint chỉ để khớp toàn bộ class diagram.

## Đặt và hủy xe dùng chung

Áp migration 005 sau 004 trước khi triển khai API đặt xe và API Hub dùng view khả dụng mới.

- `POST /api/vehicle-reservations` trả 201 khi tạo lượt. Cùng Student và requestId, gửi lại cùng vehicleId trả 200 với lượt cũ theo trạng thái hiện tại và hạn cũ. Dùng requestId đó cho xe khác trả 409 `REQUEST_ID_REUSED`.
- `GET /api/me/reservations` trả `data.reservations` của chính Student, mới nhất trước. DTO lượt đặt có mã xe, tên Hub, ID và mã chỗ nhận. Chỉ có `pickupCode` khi lượt vẫn còn hiệu lực. Nếu đã nhận xe, `tripId` và `tripStatus` lấy từ chuyến tương ứng.
- `POST /api/vehicle-reservations/{id}/cancel` trả 200 khi hủy thành công hoặc lượt của mình đã `CANCELLED`. Lượt ngoài quyền đọc trả 404. Lượt hết hạn trả 409 `RESERVATION_EXPIRED` và ghi nhận thu hồi. Lượt đã nhận xe trả 409 `INVALID_STATE`.
- Hub list và detail đọc cùng view khả dụng. Chi tiết trả thêm `isBookable` để chọn xe. Lượt hết hạn được xem là hết hiệu lực ngay khi đọc và được ghi nhận khi có thao tác liên quan.

## Nhận và trả

Kết quả thành công giữ `{command, trip}` theo DTO hiện có; command chỉ là kết quả giả lập của request, không cần bảng riêng. Thất bại trả lỗi và không thay đổi reservation/trip/tài nguyên. MVP không trả 202 hoặc poll ACK. Không cho Student tự chọn kết quả thành công của thiết bị; mô phỏng lỗi do cấu hình demo phía server/Operator điều khiển khi triển khai.

## What-if

Giữ hubIds, demandMultiplier, failedChargingPoints, projectedArrivals, arrivalHubId, horizonMinutes và seed để không đổi form/schema khi các bạn bắt đầu. horizon là khoảng ước lượng; chưa cần engine chạy theo từng bước thời gian. projectedArrivals là số xe dự kiến đến; khi lớn hơn 0, arrivalHubId bắt buộc và phải thuộc hubIds. So sánh số xe đến với chỗ FLEET trống tại Hub đó để phát hiện xe vượt sức chứa. Kết quả mỗi Hub có `isFleetFull`, `parkedVehicleCount` và `hasMostParkedVehicles` để phân biệt Hub đầy với Hub có nhiều xe nhất trong các Hub được chọn. Trả số xe/chỗ/cổng thiếu và gợi ý theo quy tắc được mô tả tại mục 04. Không yêu cầu lưu run hoặc API chạy lại từ lịch sử.

## Bổ sung parking

Ba mutation parking kiểm tra session/role trước khi đọc body; chưa đăng nhập trả 401 dù JSON sai. Request ID hợp lệ được dùng để tương quan response sau bước Auth. POST đặt chỗ dùng requestId theo owner: cùng payload trả kết quả ban đầu, khác payload trả 409 REQUEST_ID_REUSED. Chưa có receipt framework hoặc retry lookup API.

GET /parking-reservations hỗ trợ page (10 dòng/trang), status; chỉ trả lượt của chính Student hoặc toàn bộ cho Operator. Response bổ sung total, plate_number, owner_name và hub_name; không trả email Auth. Các trường snake_case của parking hiện giữ tương thích, còn chi tiết Hub đã đổi các khóa tài nguyên sang camelCase theo contract chung.

Parking cần migration 004 sau 002/003. Giờ form và hiển thị theo múi giờ UTC+7 trong SHARED_CONFIG. Không tự chuyển xe ra khỏi chỗ khi hết lịch; Operator vẫn xác nhận DEPARTED. No-show tự động tiếp tục ngoài MVP.
