# Cấu hình Auth và dữ liệu demo

Các bước dưới đây dành cho quản trị project. Thành viên dùng env và tài khoản được cấp theo [SETUP](SETUP.md).

## 1. Áp schema và seed

1. Trên project trống, chạy từng file trong [supabase/migrations](../supabase/migrations) theo thứ tự 001–009, mỗi file một lần. Trên project đang dùng, chỉ chạy migration chưa áp. Kiểm tra kết quả từng file trước khi chuyển sang file kế tiếp.
2. Chạy [supabase/seed.sql](../supabase/seed.sql) để thêm tài nguyên demo. Seed bỏ qua dòng đã có. Với project chung đã có dữ liệu nền, nếu chỉ cần bổ sung EV07 và hai chỗ ở H01 thì chạy riêng khối `Classroom demo` trong một transaction.
3. Chạy các file trong [supabase/tests](../supabase/tests) trên database thử đã áp schema và seed. Fixture được rollback cuối mỗi script.

Migration tạo cả bảng tài nguyên và bảng nghiệp vụ, cùng policy và grants tương ứng. Migration 003 thu hồi quyền gọi trực tiếp hàm tự bật RLS nếu hàm đó tồn tại. Giữ RLS và kiểm tra lỗi SQL trước khi thử lại.

## 2. Tạo tài khoản và xe cá nhân mẫu

Trong Supabase Authentication → Users, tạo Student và Operator với thông tin do nhóm quản lý. Profile mới có role `STUDENT`. Lấy ID của tài khoản được chọn làm Operator rồi gán role bằng SQL Editor:

```sql
update public.app_users
set role = 'OPERATOR', display_name = 'Operator demo'
where id = 'UUID_CUA_OPERATOR';
```

Để demo parking, chọn UUID của một Student:

```sql
insert into public.private_vehicles(owner_id, plate_number, battery_percent)
select id, 'DEMO-01', 50
from public.app_users
where id = 'UUID_CUA_STUDENT' and role = 'STUDENT'
on conflict (plate_number) do nothing;
```

Nếu `DEMO-01` đã thuộc tài khoản khác, dùng biển demo khác và xác nhận Student thấy xe trong form parking. Giữ thông tin đăng nhập trong kênh riêng của nhóm.

## 3. Cấu hình ứng dụng và thử session

Cấu hình hai biến trong `.env.example` cho local/Vercel. Đặt Site URL trong Supabase Auth theo URL Vercel của nhóm. Đăng nhập email/password chuyển Student tới `/hubs` và Operator tới `/operator`.

- `/api/me` trả đúng role sau khi đăng nhập và 401 sau khi đăng xuất. Kiểm tra refresh và đổi tài khoản trong cùng tab.
- Student bị chặn ở trang/API Operator. Operator không truy cập các trang dành riêng cho Student.
- [Demo và kiểm thử](implementation/04_UI_AND_DEMO.md) ghi các luồng nghiệp vụ và kết quả đã xác minh.
