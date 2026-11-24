# Supabase

Hướng dẫn áp migration, seed, tạo tài khoản và kiểm thử: [AUTH_SETUP](../docs/AUTH_SETUP.md). Migration 001/seed đã áp vào project chung, RLS và đăng nhập đã kiểm tra. Thành viên không chạy lại migration khi clone; chỉ quản trị project mới làm theo các bước tạo.

UC05 cần review rồi áp `migrations/002_parking.sql` một lần sau 001. `003_revoke_rls_auto_enable.sql` ghi nhận revoke đã chạy thủ công trên project chung, giữ nguyên event trigger. `tests/parking.sql` chỉ chạy ở database thử và rollback fixtures. Không tự áp migration khi chỉ clone app.

Cập nhật phiên fix parking: review rồi áp `migrations/004_parking_review_fixes.sql` **một lần**, sau 002/003 và **trước khi merge/deploy code gọi parking_list**. Migration giữ dữ liệu cũ, không thêm CHECK áp ngược lên các lượt đặt dài đã tồn tại. Code cũ vẫn dùng được sau 004; code mới cần 004 để đọc parking. Không chạy lại 001/002/004. Nếu SQL báo lỗi, dừng và kiểm tra trạng thái transaction trước khi thử lại; không merge khi 004 chưa thành công.

Sau đó kiểm tra quyền EXECUTE và hai luồng Student/Operator trên bản deploy mới. `tests/parking_review.sql` chỉ dùng ở DB test, không chạy fixture trên project chung.
