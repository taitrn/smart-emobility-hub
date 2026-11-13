# Cách làm việc

Mở [TEAM_CHECKLIST](TEAM_CHECKLIST.md), chọn phần được giao rồi đọc TODO trong file. Khi cần chạm file chung hoặc phần của bạn khác, ghi rõ lý do và ảnh hưởng trong PR, giữ phần không liên quan.

## Nhánh và PR

Các nhánh theo bảng dưới đây đã được tạo từ main. Lấy đúng nhánh phần việc của mình (ví dụ UC02):

```sh
git fetch origin
git switch --track origin/feat/uc02-reservation
```

Nếu nhánh đã có ở local, dùng `git switch feat/uc02-reservation`. Làm việc trên nhánh riêng, push nhánh và mở PR về `main`. Khi bắt đầu phần việc mới chưa có nhánh, tạo `feat/<ten-phan-viec>` từ `main` mới nhất.

Auth/data đã có trên `main`; không cần tạo lại nhánh Auth.

Tên nhánh theo phần việc:

| Phần việc | Người phụ trách | Nhánh |
|---|---|---|
| UC01: Hub | Tài | `feat/uc01-hubs` |
| UC02/07: đặt và hủy xe | Tiến | `feat/uc02-reservation` |
| UC03: nhận xe | Toàn | `feat/uc03-pickup` |
| UC04: trả xe | Ân | `feat/uc04-return` |
| UC05: parking | Tài tổng hợp | `feat/uc05-parking` |
| UC11: What-if | Việt Anh | `feat/uc11-simulation` |
| Sạc | Việt Anh + Tài* | `feat/charging` |
| Dashboard Operator | Ân + Toàn* | `feat/operator-dashboard` |

\* Phân công đề xuất, chờ các bạn xác nhận.

Một PR theo một phần việc. Mô tả ngắn: hành vi đã làm, file/schema thay đổi, cách kiểm tra, dependency và phần chưa làm. Dùng commit rõ nghĩa như `feat: implement vehicle reservation` hoặc `fix: reject overlapping parking intervals`.

## Giữ hợp đồng chung

- Quy tắc dùng chung ở `src/config/shared.ts`; không tự đặt một hạn giữ xe/step simulation khác trong feature. Server/DB kiểm tra thời gian; không thêm scheduler nền.
- DTO/trạng thái ở `src/lib/domain`; request boundary dùng Zod; API dùng cùng envelope `ok/data/error/requestId`.
- Không tạo actor demo trong guard để bỏ qua Auth. User/role lấy từ server và kiểm tra cả trong RPC nhạy cảm.
- Thay `throw notImplemented(...)` bằng nghiệp vụ thật khi nhận module; không đổi thành `return []` hoặc `ok:true` để làm smoke xanh.
- Migration và transaction/RPC cần thiết đi cùng PR feature, không dựng framework command/receipt. Không dùng biến server hoặc file JSON ghi cục bộ làm database chung trên Vercel.
- Không commit `.env.local`, key, mật khẩu, `node_modules`, build hay chatlog. Không reset seed tự động mỗi build.

## Kiểm tra

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Test hiện kiểm tra boundary input và role, không chứng minh use case/RLS đã đúng. Thêm kiểm tra hành vi tương ứng khi triển khai RPC/service, giữ tests vừa đủ.

Sau khi chạy app local có env, đặt `$env:AUTH_CONFIGURED="1"` trên PowerShell rồi chạy `npm run smoke`. Script chỉ chạy host local, không gửi session: health 200, input sai 400, API bảo vệ 401, public feature stub 501. Không có env thì bỏ AUTH_CONFIGURED, API bảo vệ trả 503. Khi triển khai feature, cập nhật expectation tương ứng. Xem [SETUP](SETUP.md).
