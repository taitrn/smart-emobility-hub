# Hướng dẫn làm việc

Đọc `docs/implementation/README.md` và `docs/TEAM_CHECKLIST.md` theo phần việc. Sử dụng phạm vi MVP hiện hành; model cũ và context local chỉ dùng để tham khảo.

- Một Next.js app, TypeScript/Tailwind, Supabase Auth/PostgreSQL, Vercel và CI cơ bản. Không thêm worker, ORM, queue, service framework hoặc môi trường triển khai khác.
- Các nhánh feature đã được tạo; làm trên nhánh feature, PR về main theo docs/CONTRIBUTING.md. Phân công chính: Tài nền/UC01/tổng hợp UC05, Tiến UC02/07, Toàn UC03, Ân UC04, Việt Anh UC11. Phần hỗ trợ: Việt Anh phụ trách sạc, Tài hỗ trợ; Ân phụ trách dashboard/sự cố, Toàn hỗ trợ (đều là đề xuất, chưa xác nhận).
- Giữ sạc, dashboard/sự cố và What-if đơn giản. Không triển khai Admin CRUD, no-show penalty, receipt framework, pending ACK/đối soát hoặc history/export chỉ vì tài liệu cũ có nhắc.
- Kiểm tra session, role, owner, thời gian và trạng thái ở server; bảo vệ dữ liệu với RLS. Thao tác nhiều bảng cần transaction thích hợp, không ép mọi API thành RPC.
- Không dùng biến Vercel Function làm dữ liệu dùng chung, không commit secret. Tài khoản demo seed qua công cụ quản trị.
- Các stub giữ 501 cho đến khi có nghiệp vụ; không hardcode actor để vượt guard hoặc trả thành công giả. Student/Operator page layouts và API kiểm tra session/role; migration/RLS nền đã áp và kiểm tra trên project demo; bảng nghiệp vụ mới cần policy riêng.
- Chạy lint, typecheck, npm test và build khi sửa app; chỉ ghi kết quả đã kiểm chứng. Không tạo thêm test chỉ để tăng số lượng.
- Giữ nguyên bài đã nộp. Báo cáo Final phân biệt làm thật/mô phỏng/chưa làm và khai báo AI trung thực. Không khẳng định giảng viên/owner đã duyệt nếu chưa có xác nhận.
