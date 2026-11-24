# Supabase

- `migrations/` chứa migration 001–009. Áp theo thứ tự số trên database trống, hoặc chỉ áp các migration còn thiếu trên database đang dùng.
- `seed.sql` tạo tài nguyên demo sau migration, gồm 3 Hub, 7 xe dùng chung, 14 chỗ đỗ và 3 cổng sạc. Seed chỉ thêm dòng thiếu.
- `tests/` kiểm tra Auth/RLS, đặt/hủy xe, trả xe và đặt chỗ cá nhân trên database thử. Các script dùng dữ liệu tạm và rollback.

Tài khoản và xe cá nhân thuộc một Student được tạo riêng theo [hướng dẫn quản trị](../docs/AUTH_SETUP.md). [Dữ liệu và kịch bản demo](../docs/implementation/04_UI_AND_DEMO.md) mô tả cách sử dụng seed.
