# 06 Đối chiếu với bài đã nộp

Đặc tả cô yêu cầu MVP và demo toàn dự án; không bắt buộc backend database, cho phép dữ liệu hardcode. Các tài liệu Sub1–3 của nhóm mô tả thiết kế rộng hơn. Bảng dưới đây đối chiếu thiết kế đã nộp với phạm vi MVP hiện hành. Các thay đổi chưa được xác nhận bởi giảng viên, và những yêu cầu trong bài cũ chưa được xem là hoàn tất nếu chưa triển khai.

| Thiết kế cũ | MVP hiện hành |
|---|---|
| SSO, offline, thiết bị/edge/gateway | Email/password demo, simulator trong ứng dụng |
| Command pending, ACK đối soát, receipt retry | Nhận/trả trả kết quả mô phỏng ngay; kiểm tra trạng thái và ràng buộc chống tạo trùng |
| No-show, khóa tài khoản tự động | Giữ deadline; hoãn cơ chế phạt |
| Sạc theo công suất/nhiệt độ và pause/resume | Ưu tiên pin ≤20% hoặc giờ rời trong 0–60 phút; FIFO cùng nhóm, cấp cổng và hoàn tất mô phỏng |
| Simulation engine nhiều bước, history, export, ranking | Các kịch bản đơn giản; bảng trước/sau và khuyến nghị |
| Duyệt/thi hành dispatch plan | Khuyến nghị điều phối trên màn hình; không thi hành tự động |
| CRUD thiết bị, incident, Admin/config | Seed dữ liệu; Operator giả lập lỗi/khôi phục |
| Worker/tick, scope Operator từng Hub | Thao tác trong phiên demo; một Operator cho cả ba Hub |
| Mọi class/method phải hiện thực | Class/method là thiết kế báo cáo; code chỉ phần cần cho chuỗi demo |

Giữ nguyên bài gốc và bản đồng bộ đã chuẩn bị. `domain-model.json` ở đây là nguồn thiết kế cũ, không ép tạo các bảng/method ngoài phạm vi mới. Khi làm Final, cập nhật phần kiến trúc/class/method liên quan cho khớp code hoặc đánh dấu rõ thiết kế mở rộng chưa triển khai. Không thay đổi bài đã nộp để giả rằng scope cũ chưa từng tồn tại.

Test case bonus cũ cũng cần đối chiếu: ca phạt no-show, pending ACK, duyệt draft, pause/resume hoặc history có thể chưa được hỗ trợ. Ghi chưa triển khai/ngoài phạm vi MVP; chỉ ghi đạt với ca đã chạy. Các NFR cũ chưa đo không được báo đạt. Phần AI phải khai báo trung thực theo trang 6 của spec.
