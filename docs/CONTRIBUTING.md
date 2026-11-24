# Đóng góp

Tạo nhánh từ `main` mới nhất và mở PR về `main`. [Checklist của nhóm](TEAM_CHECKLIST.md) dẫn tới các module đã ghép.

```sh
git switch main
git pull --ff-only
git switch -c fix/ten-thay-doi
```

Mỗi PR tập trung vào một thay đổi. Mô tả hành vi, cách kiểm tra và ảnh hưởng tới API hoặc migration nếu có.

## Hợp đồng dùng chung

- DTO và Zod schema ở `src/lib/domain`, quy tắc ứng dụng ở `src/config/shared.ts`. API dùng chung envelope `ok/data/error/requestId`.
- API kiểm tra session và role trước validation ở các route được bảo vệ. Quyền trên bản ghi được kiểm tra ở service/RPC và RLS.
- Thay đổi schema bằng migration mới. Khi code phụ thuộc schema mới, kiểm tra migration trên database thử và áp đúng thứ tự trước khi triển khai.
- Giữ `.env.local`, thông tin đăng nhập demo, ghi chú nội bộ, build và dependency ngoài Git. Seed chỉ bổ sung tài nguyên mẫu.

## Kiểm tra

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Xem [SETUP](SETUP.md) để chạy smoke local. Khi sửa luồng có ghi dữ liệu, kiểm tra thành công, sai quyền và xung đột trên database thử. [Các luồng demo](implementation/04_UI_AND_DEMO.md) mô tả cách thử và phạm vi kết quả.
