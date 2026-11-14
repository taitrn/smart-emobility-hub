# Supabase

Hướng dẫn áp migration, seed, tạo tài khoản và kiểm thử: [AUTH_SETUP](../docs/AUTH_SETUP.md). Migration 001/seed đã áp vào project chung, RLS và đăng nhập đã kiểm tra. Thành viên không chạy lại migration khi clone; chỉ quản trị project mới làm theo các bước tạo.

UC05 cần review rồi áp `migrations/002_parking.sql` một lần sau 001. `003_revoke_rls_auto_enable.sql` ghi nhận revoke đã chạy thủ công trên project chung, giữ nguyên event trigger. `tests/parking.sql` chỉ chạy ở database thử và rollback fixtures. Không tự áp migration khi chỉ clone app.
