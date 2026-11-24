# Kế hoạch triển khai MVP

Tài liệu kỹ thuật cho MVP môn **Software Engineering (CO3001)**, HCMUT, HK261, nhóm L02_1.

## Đọc để bắt đầu

- [Checklist của nhóm](../TEAM_CHECKLIST.md): người phụ trách và việc cần làm.
- [01 Phạm vi](01_SCOPE_AND_RULES.md): chức năng và quy tắc tối thiểu.
- [02 Kiến trúc và dữ liệu](02_ARCHITECTURE_AND_DATA.md): cách ghép ứng dụng và lưu dữ liệu.
- [03 API](03_API_CONTRACTS.md): các điểm nối giữa UI và service.
- [04 Demo và kiểm thử](04_UI_AND_DEMO.md): dữ liệu mẫu và các luồng cần chạy.
- [05 Bàn giao](05_WORK_PLAN.md): các bước chuẩn bị demo.
- [06 Đối chiếu tài liệu cũ](06_SUBMISSION3_ALIGNMENT.md): giới hạn so với thiết kế đã nộp.

## Hiện trạng

MVP gồm tra cứu Hub, đặt/hủy–nhận–trả xe, parking, sạc, dashboard vận hành và What-if. [Cài đặt](../SETUP.md) hướng dẫn chạy app. [Demo và kiểm thử](04_UI_AND_DEMO.md) ghi phạm vi kiểm tra theo môi trường.

## Quy mô

Một Next.js app, TypeScript/Tailwind, Supabase Auth và PostgreSQL, một bản demo Vercel, CI một job. Đề bài cho phép hardcode và không bắt buộc database; Supabase là lựa chọn của nhóm để dùng chung dữ liệu, không phải yêu cầu của cô.

Giữ sáu UC được phân công, thêm sạc, dashboard và mô phỏng sự cố ở mức đơn giản. Không xây dựng toàn bộ method/class, Admin CRUD, hệ thống IoT hay nền tảng vận hành liên tục. `domain-model.json` là nguồn thiết kế cũ để tham khảo báo cáo, không phải danh sách phải code.

Spec gốc: BTL_SoftwareEngineering_HK261_v1.pdf, trang 3–5. Phần đối chiếu phân biệt chức năng đã triển khai, mô phỏng và thiết kế mở rộng.
