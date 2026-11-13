# Cài đặt và chạy

## Thành viên trong nhóm

Cần Git, Node 24 và npm. Clone repo, chạy `npm ci`, copy `.env.example` thành `.env.local`, điền hai giá trị do Tài cung cấp rồi chạy `npm run dev`. Không ghi đè `.env.local` nếu đã cấu hình.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Mở http://localhost:3000. Không có env vẫn xem được trang public/health; trang riêng tư cần Supabase. Tài khoản và mật khẩu demo được chia sẻ riêng. Không chạy migration hoặc seed lại trên project chung khi chỉ muốn chạy ứng dụng.

Nền Auth/data đã được kiểm tra trên local và [Vercel production](https://smart-emobility-hub.vercel.app): đăng nhập/đăng xuất, role Student/Operator, refresh session, đổi tài khoản trong cùng tab và redirect từ `/login`. Các use case nghiệp vụ vẫn là stub.

## Kiểm tra local

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Khi app đang chạy với env Supabase, PowerShell:

```powershell
$env:AUTH_CONFIGURED="1"
npm run smoke
```

Script không gửi session: health trả 200, input sai trả 400, API có quyền trả 401; public Hub service chưa làm trả 501. Thiếu env thì bỏ AUTH_CONFIGURED và API bảo vệ trả 503. Khi triển khai feature, cập nhật expectation tương ứng. Test hiện kiểm tra boundary/role; chưa chứng minh nghiệp vụ đặt/nhận/trả.

## Quản trị Supabase

Project demo chung đã có schema nền và seed. [AUTH_SETUP](AUTH_SETUP.md) dành cho người quản trị khi dựng project mới hoặc chạy lại kiểm tra quyền. Migration 001 chỉ chạy một lần; seed chỉ bổ sung dòng thiếu, không reset dữ liệu vận hành.

SQL và tài khoản demo không thay thế quyền RLS. Các bảng lượt đặt/chuyến/phiên sạc và transaction liên quan sẽ thêm cùng feature. Không dùng secret/service-role key trong API người dùng hoặc browser.

## Quản trị Vercel

Project đã kết nối GitHub; production theo `main`, PR có Preview. Hai biến trong `.env.example` phải có trên môi trường cần dùng; đổi env thì redeploy. Health chỉ xác nhận app chạy, không kiểm tra database.

Khi tạo lại Vercel project: import repo, framework Next.js, root `.`, Node 24, cấu hình hai biến public và deploy bằng Git integration. Không cần workflow deploy riêng hoặc token Vercel trong GitHub Actions.

## Tham khảo

- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Vercel Git](https://vercel.com/docs/deployments/git)
