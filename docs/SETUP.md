# Setup và tích hợp tiếp theo

## Local

Dùng Node.js 24 LTS, npm và Git. `npm ci` → `npm run dev`; mở http://localhost:3000.

Trên nền main hiện hành: chạy `npm test` để kiểm tra input boundaries. Với app local đang mở, `npm run smoke` kiểm tra health và các API stub (501). Đây không phải login hoặc kiểm thử dữ liệu nghiệp vụ.

Trên PowerShell, chuẩn bị env khi cần Supabase:

```powershell
Copy-Item .env.example .env.local
```

Trên macOS/Linux: `cp .env.example .env.local`. Điền hai biến từ Supabase Dashboard → Project Settings → API, khởi động lại dev server. `NEXT_PUBLIC_*` được đưa vào browser lúc build; URL/publishable key là cấu hình public, không phải secret để vượt quyền.

Không cần env cho shell/placeholder/health. Gọi client Supabase khi chưa cấu hình sẽ báo lỗi thay vì âm thầm dùng dữ liệu giả.

## Supabase: chưa nối project thật

Scaffold chưa kết nối project Supabase của nhóm. Sử dụng cấu hình do nhóm cung cấp khi tích hợp.

Khi có project demo, ghép PR Auth/data trước feature có dữ liệu riêng tư:

1. Tạo migration nền theo mục 02: profile/role, Hub/tài nguyên; Operator demo quản lý cả ba Hub. Tên bảng theo spec, ví dụ `mobility_hubs`, `shared_vehicles`.
2. Bật RLS, giới hạn đọc/ghi; người dùng không tự gán role. Mutation cạnh tranh dùng RPC transaction nhỏ trong PR feature tương ứng.
3. Seed theo mục 04; Auth accounts tạo qua Dashboard/công cụ quản trị. Không đưa mật khẩu vào seed, README hay Git.
4. Ghép login/logout và session-refresh Proxy theo hướng dẫn SSR hiện hành. Server xác minh danh tính qua `getClaims()` hoặc `getUser()` rồi đọc role đáng tin cậy; không tin `getSession()` riêng lẻ.
5. Bảo vệ trang/API trước khi thay placeholder bằng dữ liệu thật. Hiện chưa có Proxy hoặc guard; route group `(operator)` không tự tạo quyền bảo vệ.
6. Kiểm tra Student/Operator và request trái quyền, kiểm tra ownership khi trả trip. Ghi kết quả thật.

Client factories dùng publishable key/session user. Không thêm service-role/secret key vào API chung. Generate type database từ migration đã áp dụng, không coi `domain-model.json` là schema đã tồn tại.

## Vercel: khi có quyền project

Chưa link Vercel project trong scaffold. Người phụ trách đăng nhập tài khoản nhóm rồi:

1. Import private repo `taitrn/smart-emobility-hub`, framework Next.js, root `.`, Node 24.x.
2. Install `npm ci`, build `npm run build`, output mặc định Next.js.
3. Khi tích hợp Supabase, đặt hai biến public từ `.env.example` ở môi trường cần dùng. Placeholder có thể deploy không cần env.
4. Deploy qua Git integration, kiểm tra URL, trang chủ và `/api/health`. Khi có login, cấu hình domain/redirect URL trong Supabase Auth.
5. Không cần workflow deploy riêng hoặc token Vercel trong Actions. CI hiện chỉ kiểm tra source.

Deployment placeholder chưa phải demo nghiệp vụ. Ghi URL/kết quả thực tế khi đã deploy.

## Tham khảo kỹ thuật

- [Next.js](https://nextjs.org/docs/app/getting-started/installation)
- [Supabase SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Vercel Git deployments](https://vercel.com/docs/deployments/git)

Không có worker, microservice, ORM hoặc hạ tầng nhiều môi trường. Chỉ thêm khi Todo cần và có lý do cụ thể.
