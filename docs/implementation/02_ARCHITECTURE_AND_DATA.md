# 02 Kiến trúc và dữ liệu tối thiểu

## Kiến trúc

Giữ cấu trúc code hiện tại: Next.js App Router → Route Handler → service theo feature → Supabase. Dùng TypeScript/Tailwind, npm, một môi trường demo. Không thêm repository/base service, worker, queue hay ORM.

UI có thể làm song song với fixture chỉ đọc; khi ghép feature, thao tác phải dùng cùng dữ liệu server. Không lưu trạng thái dùng chung trong biến của Vercel Function.

## Dữ liệu nền và phần sẽ triển khai

Migration 001 đã tạo app_users, mobility_hubs, shared_vehicles, parking_spaces, charging_points và private_vehicles. Bảng parking_reservations đã được tạo bởi migration 002 (bổ sung cột request_id ở 004). Ba bảng vehicle_reservations, trips và charging_sessions chưa tạo; chúng đi cùng feature.

| Bảng | Nội dung chính |
|---|---|
| app_users | id trùng Auth user, display_name, role STUDENT/OPERATOR; không cho tự sửa role |
| mobility_hubs | tên, vị trí, trạng thái |
| shared_vehicles | Hub, chỗ, pin và trạng thái |
| parking_spaces | Hub, FLEET/PRIVATE, tình trạng có xe |
| vehicle_reservations | chủ lượt, xe, mã nhận, thời điểm đặt/hết hạn, trạng thái |
| trips | chủ chuyến, xe, reservation, thời điểm nhận/trả |
| private_vehicles | chủ xe và mã/biển số demo |
| parking_reservations | chủ lượt, xe, chỗ, start/end, trạng thái |
| charging_points | Hub, trạng thái cổng |
| charging_sessions | xe, người yêu cầu, cổng nếu đã cấp, pin/giờ rời và trạng thái |

UUID là ID, mã H01/EV01 để hiển thị. Giờ lưu UTC và hiển thị UTC+7. Dữ liệu mẫu cố định; thời gian lượt đặt tạo theo giờ server. Không cần bảng operator_hubs, device_commands, request_receipts, event_logs, incidents, simulation_runs/results hoặc operation_drafts cho bản đầu.

## Ghi dữ liệu và quyền

- Supabase Auth email/password cho vài tài khoản demo, role được gán bằng công cụ quản trị; browser/server client đã có trong scaffold.
- RLS nền đã bật; các bảng nghiệp vụ sắp tạo phải bổ sung policy riêng. Quyền đọc dự kiến: thông tin Hub/tài nguyên được đọc công khai ở mức cần hiển thị; lượt đặt/chuyến là của chính Student; Operator demo thao tác tài nguyên. Không xuất mã nhận hoặc dữ liệu người dùng trong Hub DTO.
- Kiểm tra session/role ở server trước thao tác. Không dùng secret key trong browser, không nhận role từ request.
- Đặt xe, nhận/trả và đặt chỗ đỗ cần cập nhật dữ liệu nhất quán. Dùng transaction/RPC nhỏ cho đúng thao tác nhiều bảng; không dựng một framework command hoặc ép mọi GET/UPDATE thành RPC.
- Dùng ràng buộc unique cho lượt đặt xe đang được giữ; chặn overlap parking bằng constraint hoặc transaction tương ứng. Kiểm tra lại điều kiện trong transaction, không chỉ disable nút UI.
- RPC có quyền nâng cao phải tự kiểm tra user/role và hạn chế EXECUTE; chỉ viết khi cần. RLS không tự thay thế việc kiểm tra trong hàm đặc quyền.
- Chưa làm receipt chống retry tổng quát: UI khóa nút khi gửi; server vẫn kiểm tra trạng thái/unique để bấm lại không tạo thêm trip hoặc đặt trùng. `requestId` hiện là mã theo dõi lỗi, không phải bảo đảm exactly-once, trừ đặt chỗ parking: POST /parking-reservations idempotent theo cặp (owner_id, request_id), cùng payload trả lại lượt đã đặt.

## Mô phỏng và triển khai

Nhận/trả mô phỏng thành công hoặc lỗi ngay, không có command pending lưu riêng. Sạc được cập nhật khi gửi yêu cầu hoặc Operator bấm xử lý hàng đợi/hoàn tất sạc; không có bộ lập lịch nền 24/7. What-if là hàm thuần nhận snapshot và trả so sánh/khuyến nghị trong một request; chưa lưu lịch sử.

UI refresh sau thao tác; có thể polling nhẹ khi cần demo nhiều cửa sổ. Không cam kết đạt mục tiêu realtime hay tải lớn nếu chưa đo. Vercel production và CI đã hoạt động. Mỗi PR kiểm tra Preview trước khi ghép main.
