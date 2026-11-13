# Supabase: bước tích hợp tiếp theo

Scaffold đã có browser/server client và `.env.example`. Chưa có migration, seed, tài khoản demo hay kết nối project thật.

Người nhận Auth/data thực hiện theo `docs/SETUP.md` và `docs/implementation/02_ARCHITECTURE_AND_DATA.md`:

1. Dùng Supabase demo project của nhóm, tạo migration nền trong `supabase/migrations/`.
2. Bật RLS, chặn client tự sửa role; cấu hình policy đọc public/own/Operator.
3. Seed Hub/tài nguyên theo mục 04. Tạo Auth user qua Dashboard, không commit mật khẩu.
4. Ghép login/logout, session-refresh Proxy và guard role trước khi thêm dữ liệu riêng tư.
5. Kiểm tra login Student/Operator/Admin và request trái quyền; ghi kết quả thật.

Chỉ thêm bảng/transaction cần cho feature; không tạo receipt/command log/history trong bản đầu. Không cần triển khai tất cả method trong domain-model.json ở scaffold.
