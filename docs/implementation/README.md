# Kế hoạch triển khai MVP

Tài liệu này mô tả phạm vi và kế hoạch triển khai MVP. Các chức năng được đánh dấu hoàn thành khi đã được phát triển và kiểm thử.

## Đọc để bắt đầu

- [Checklist của nhóm](../TEAM_CHECKLIST.md): người phụ trách và việc cần làm.
- [01 Phạm vi](01_SCOPE_AND_RULES.md): chức năng và quy tắc tối thiểu.
- [02 Kiến trúc và dữ liệu](02_ARCHITECTURE_AND_DATA.md): cách ghép ứng dụng và lưu dữ liệu.
- [03 API](03_API_CONTRACTS.md): các điểm nối giữa UI và service.
- [04 Demo và kiểm thử](04_UI_AND_DEMO.md): dữ liệu mẫu và các luồng cần chạy.
- [05 Thứ tự công việc](05_WORK_PLAN.md): phụ thuộc và điều kiện hoàn tất.
- [06 Đối chiếu tài liệu cũ](06_SUBMISSION3_ALIGNMENT.md): giới hạn so với thiết kế đã nộp.

## Hiện trạng

Nền Auth/data đã chạy và được kiểm tra local/production. Các bảng tài nguyên có migration và seed (001), parking có migration 002–004. UC01 (tra cứu Hub) và UC05 (đặt chỗ đỗ PRIVATE, Operator mô phỏng đến/rời) đã triển khai và chạy trên production; UC02/03/04/07/11, sạc và dashboard vẫn chưa triển khai. Khi nhận việc, đọc SETUP và checklist; không cần dựng lại project cloud.

## Quy mô

Một Next.js app, TypeScript/Tailwind, Supabase Auth và PostgreSQL, một bản demo Vercel, CI một job. Đề bài cho phép hardcode và không bắt buộc database; Supabase là lựa chọn của nhóm để dùng chung dữ liệu, không phải yêu cầu của cô.

Giữ sáu UC được phân công, thêm sạc, dashboard và mô phỏng sự cố ở mức đơn giản. Không xây dựng toàn bộ method/class, Admin CRUD, hệ thống IoT hay nền tảng vận hành liên tục. `domain-model.json` là nguồn thiết kế cũ để tham khảo báo cáo, không phải danh sách phải code.

Spec gốc: BTL_SoftwareEngineering_HK261_v1.pdf, trang 3–5. Khi ghép Final phải phân biệt chức năng đã chạy, chức năng mô phỏng và phần chưa làm; khai báo AI theo trang 6. Các mục tiêu hiệu năng trong bài cũ chưa được xem là đạt nếu chưa đo.
