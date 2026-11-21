# Supabase

Hướng dẫn áp migration, seed, tạo tài khoản và kiểm thử: [AUTH_SETUP](../docs/AUTH_SETUP.md). Migration 001/seed đã áp vào project chung, RLS và đăng nhập đã kiểm tra. Thành viên không chạy lại migration khi clone; chỉ quản trị project mới làm theo các bước tạo.

UC05 cần review rồi áp `migrations/002_parking.sql` một lần sau 001. `003_revoke_rls_auto_enable.sql` ghi nhận revoke đã chạy thủ công trên project chung, giữ nguyên event trigger. `tests/parking.sql` chỉ chạy ở database thử và rollback fixtures. Không tự áp migration khi chỉ clone app.

Cập nhật phiên fix parking: review rồi áp `migrations/004_parking_review_fixes.sql` **một lần**, sau 002/003 và **trước khi merge/deploy code gọi parking_list**. Migration giữ dữ liệu cũ, không thêm CHECK áp ngược lên các lượt đặt dài đã tồn tại. Code cũ vẫn dùng được sau 004; code mới cần 004 để đọc parking. Không chạy lại 001/002/004. Nếu SQL báo lỗi, dừng và kiểm tra trạng thái transaction trước khi thử lại; không merge khi 004 chưa thành công.

Sau đó kiểm tra quyền EXECUTE và hai luồng Student/Operator trên bản deploy mới. `tests/parking_review.sql` chỉ dùng ở DB test, không chạy fixture trên project chung.

## Thử UC04 khi UC03 chưa tạo chuyến

Dùng Supabase riêng để thử. Sau khi áp các migration và seed nền, tạo một tài
khoản Student trong Auth. Thay UUID bên dưới bằng ID của tài khoản đó rồi chạy
đoạn SQL sau với quyền quản trị trên database thử nghiệm. Fixture lấy xe EV01
từ seed và tạo chuyến đang chạy, nên chỉ chạy một lần trên dữ liệu seed mới.

```sql
begin;
with picked_up as (
  update public.shared_vehicles
    set status = 'IN_USE', slot_id = null
    where code = 'EV01' and status = 'AVAILABLE'
    returning id
), released_slot as (
  update public.parking_spaces set occupancy_status = 'FREE'
    where code = 'H01-S1' and exists (select 1 from picked_up)
)
insert into public.trips(owner_id, vehicle_id, reservation_id)
select '<student-uuid>'::uuid, id, gen_random_uuid() from picked_up;

-- H02-S3 vẫn trống nhưng khóa mô phỏng lỗi; H03-S3 dùng để thử thành công.
insert into app_private.return_lock_failures(slot_id)
select id from public.parking_spaces where code = 'H02-S3';
commit;
```

Trỏ `.env.local` đến Supabase thử nghiệm, chạy `npm run dev`, đăng nhập bằng
Student vừa tạo rồi mở `/trips`. Trả vào H02-S3 để thấy chuyến vẫn hoạt động.
Trả lại vào H03-S3 để thấy chuyến hoàn tất. Bài kiểm tra SQL độc lập
`supabase/tests/uc04_return.sql` tự rollback fixture và cần seed nền chưa sửa.

Khi ghép UC02/UC03, dùng cùng bảng `trips`: pickup ghi `owner_id`, `vehicle_id`
và `reservation_id` của lượt đặt thực, chuyển xe sang `IN_USE`, xóa `slot_id`
của xe và giải phóng chỗ nhận trong cùng giao dịch. Sau khi có schema UC02, ghép
khóa ngoại cho `reservation_id` và bỏ fixture demo trước khi áp khóa ngoại.
