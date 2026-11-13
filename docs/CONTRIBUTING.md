# Cách làm việc

Mở [TEAM_CHECKLIST](TEAM_CHECKLIST.md), chọn phần được giao rồi đọc TODO trong file. Khi cần chạm file chung hoặc phần của bạn khác, ghi rõ lý do và ảnh hưởng trong PR, giữ phần không liên quan.

## Nhánh và PR

Lấy nhánh đã tạo sẵn từ remote (ví dụ UC02):

```sh
git fetch origin
git switch --track origin/feat/uc02-reservation
```

Nếu nhánh đã có ở local, dùng `git switch feat/uc02-reservation`. Làm việc trên nhánh riêng, push nhánh và mở PR về `main`. Khi bắt đầu phần việc mới chưa có nhánh, tạo `feat/<ten-phan-viec>` từ `main` mới nhất.

Tên nhánh theo phần việc:

| Phần việc | Người phụ trách | Nhánh |
|---|---|---|
| Auth và dữ liệu nền | Tài | `feat/auth-data` |
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

Test hiện kiểm tra boundary input chung, không chứng minh use case/RLS đã đúng. Thêm kiểm tra hành vi tương ứng khi triển khai RPC/service, giữ tests vừa đủ.

Sau khi chạy app local, `npm run smoke` kiểm tra health và các API stub. Nếu chạy ở port khác: `npm run smoke -- http://127.0.0.1:3100`. Script này chỉ chấp nhận host local, không gửi session; nó mong API nghiệp vụ chưa làm trả 501. Khi Auth/feature được triển khai, sửa từng expectation và kiểm tra quyền tương ứng, không giữ 501 làm mục tiêu cuối.
