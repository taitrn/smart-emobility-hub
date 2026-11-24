# Hướng dẫn làm việc

Đọc `docs/implementation/README.md` và `docs/TEAM_CHECKLIST.md` theo phần việc. Sử dụng phạm vi MVP hiện hành; model cũ và context local chỉ dùng để tham khảo.

- Một Next.js app, TypeScript/Tailwind, Supabase Auth/PostgreSQL, Vercel và CI cơ bản. Không thêm worker, ORM, queue, service framework hoặc môi trường triển khai khác.
- Tạo nhánh từ main và mở PR theo docs/CONTRIBUTING.md. Xem docs/TEAM_CHECKLIST.md để xác định module liên quan.
- Giữ sạc, dashboard/sự cố và What-if đơn giản. Không triển khai Admin CRUD, no-show penalty, receipt framework, pending ACK/đối soát hoặc history/export chỉ vì tài liệu cũ có nhắc.
- Kiểm tra session, role, owner, thời gian và trạng thái ở server; bảo vệ dữ liệu với RLS. Thao tác nhiều bảng cần transaction thích hợp, không ép mọi API thành RPC.
- Không dùng biến Vercel Function làm dữ liệu dùng chung, không commit secret. Tài khoản demo seed qua công cụ quản trị.
- Layout và API kiểm tra session/role. Giữ chính sách RLS tương ứng khi bổ sung bảng nghiệp vụ.
- Chạy lint, typecheck, npm test và build khi sửa app; chỉ ghi kết quả đã kiểm chứng. Không tạo thêm test chỉ để tăng số lượng.
- Giữ nguyên bài đã nộp. Khi mô tả dự án, phân biệt luồng triển khai, luồng mô phỏng và phần ngoài phạm vi.
