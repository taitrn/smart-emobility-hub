# 05 Thứ tự triển khai

Scaffold đã có code khung và CI. Các chức năng nghiệp vụ sẽ được triển khai theo thứ tự dưới đây.

## Thứ tự

1. Tài nối project Supabase của nhóm: tài khoản demo Student/Operator, RLS, Hub/xe/chỗ/cổng và seed. Chưa cần tất cả bảng nghiệp vụ.
2. Các bạn làm UI và logic thuần song song theo checklist. Thêm migration cần thiết cùng feature và trao đổi field dùng chung trước khi ghép.
3. Ghép đặt → nhận → trả; sau đó parking, sạc, dashboard/sự cố và What-if. Sạc/What-if phải có trong demo nhưng giữ thuật toán đơn giản.
4. Chạy manual test theo mục 04, sửa lỗi, deploy Vercel và tập demo. Không coi placeholder deploy được là MVP đã xong.

## Chia việc

[TEAM_CHECKLIST](../TEAM_CHECKLIST.md) là nơi duy nhất ghi người/file/Todo chi tiết, tránh duy trì nhiều bảng phân công khác nhau. Dùng nhánh feature đã tạo sẵn, PR về main, theo [CONTRIBUTING](../CONTRIBUTING.md).

## Điều kiện bàn giao

- Clone/chạy được theo README; lint, typecheck, tests và build qua.
- Tài khoản demo dùng được; dữ liệu của Student không đọc/ghi tùy ý bởi người khác.
- Các luồng chính trong mục 04 chạy qua UI, có thông báo lỗi cơ bản.
- Seed và hướng dẫn demo rõ; ghi riêng kết quả local và Vercel, không khẳng định cloud đã nối nếu chưa thử.
- Chuẩn bị một PDF Final tổng hợp các phần nộp, chuỗi màn hình demo hoạt động, slide trình bày và khai báo AI/đóng góp trung thực.

## Khi thiếu thời gian

Bỏ làm đẹp, filter nâng cao, Admin CRUD, history/export, draft approval và engine simulation tổng quát trước. Không bỏ sạc/What-if hoặc tính đúng của đặt/nhận/trả chỉ để thêm nhiều màn hình. Không đặt thêm mục tiêu benchmark hay CI phức tạp.
