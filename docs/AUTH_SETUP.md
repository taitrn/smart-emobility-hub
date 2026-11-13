# Cấu hình Auth và dữ liệu nền

Project chung đã có schema, seed và tài khoản; các bước tạo bên dưới chỉ dành cho quản trị project mới. Thành viên không chạy lại migration trên project chung. Kiểm tra Auth, session/role và RLS đã được thực hiện local/production; các feature chưa triển khai vẫn cần kiểm thử riêng.

## 1. Áp dụng SQL

Trong Supabase của nhóm, mở SQL Editor → New query. Lần lượt chạy:

1. `supabase/migrations/001_auth_and_resources.sql` (chạy một lần trên project mới).
2. `supabase/seed.sql` (có thể chạy lại, không ghi đè dữ liệu đang có).

Migration tạo profile và năm bảng tài nguyên, RLS và grants tường minh. Các bảng lượt đặt/chuyến/sạc chưa tạo; chúng đi cùng feature. Không chạy migration vào database khác đang có dữ liệu mà chưa kiểm tra. Nếu báo lỗi, dừng và ghi lại thông báo; không tắt RLS để xử lý.

## 2. Tạo tài khoản demo

Authentication → Users → Add user: tạo hai Student và một Operator bằng email hợp lệ do nhóm chọn, mật khẩu riêng, xác nhận email bằng công cụ quản trị. Không commit email đăng nhập/mật khẩu demo vào repo public. Profile mới mặc định STUDENT; user không thể tự gán role bằng metadata.

Đọc danh sách để lấy ID thật:

```sql
select u.id, u.email, p.role
from auth.users u join public.app_users p on p.id = u.id;
```

Đổi đúng một profile thành Operator trong SQL Editor (thay UUID trước khi chạy):

```sql
update public.app_users
set role = 'OPERATOR', display_name = 'Operator demo'
where id = 'UUID_CUA_OPERATOR';
```

Nếu cần tạo xe cá nhân mẫu, dùng ID của Student thực:

```sql
insert into public.private_vehicles(owner_id, plate_number, battery_percent)
values ('UUID_CUA_STUDENT', 'DEMO-01', 50);
```

## 3. URL và ứng dụng

Supabase Authentication → URL Configuration: Site URL là URL Vercel của nhóm. Thêm `http://localhost:3000` và URL Vercel vào danh sách redirect được phép cho các luồng email sau này. Login email/password hiện chuyển đến route nội bộ cố định; chưa có sign-up/reset password.

`.env.local` và Vercel cần hai biến trong `.env.example`; không cần secret key cho API người dùng. Sau khi đổi env Vercel, redeploy. Supabase client và Proxy dùng session user; kiểm tra quyền trong API và RLS.

## 4. Xác minh

- Login bằng Student: `/api/me` trả role STUDENT. `/reservations` mở được; `/operator` chuyển trang không có quyền.
- Login bằng Operator: dashboard mở được; `/api/me` trả OPERATOR.
- Logout: `/api/me` trả 401; trang riêng tư chuyển về login. Gửi API Operator bằng Student phải trả 403.
- Trong cùng một tab: đăng nhập → đăng xuất → đăng nhập lại hoặc đổi tài khoản, lặp ba lần. Nút Đăng xuất phải luôn bấm được sau mỗi lần đăng nhập, không cần F5.
- Khi đã đăng nhập, mở `/login` phải chuyển về `/hubs` (Student) hoặc `/operator` (Operator). Trang không có quyền hướng dẫn đăng xuất để đổi tài khoản.
- UI đăng nhập sai không báo thành công; profile thiếu/migration lỗi phải báo rõ thay vì cấp role mặc định.
- Chạy `supabase/tests/auth_rls.sql` trong SQL Editor sau migration để kiểm tra grants/RLS trên dữ liệu tạm rồi rollback. Đây không thay thế thử session đăng nhập thật.
- Các API feature chưa triển khai vẫn trả 501 sau khi qua Auth; health chỉ kiểm tra app. Chưa có bằng chứng DB/deploy chỉ vì build xanh.

## Component UI

`src/components/ui` có Button, Input và Card dùng Tailwind, được dùng ở login. Đây là component nền của repo, chưa cài shadcn CLI/registry. Có thể bổ sung shadcn khi một feature cần component tương tác; tránh ghi đè các Supabase client đang dùng.
