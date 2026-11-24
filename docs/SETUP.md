# Cài đặt và chạy

## Thành viên trong nhóm

Cần Git, Node 24 và npm. Clone repo, chạy `npm ci`, copy `.env.example` thành `.env.local`, điền hai giá trị do Tài cung cấp rồi chạy `npm run dev`. Không ghi đè `.env.local` nếu đã cấu hình.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Mở <http://localhost:3000>. Trang chủ và `/api/health` chạy khi thiếu env. Tra cứu Hub, đăng nhập và các luồng nghiệp vụ dùng Supabase. Tài khoản demo được chia sẻ riêng trong nhóm. Dùng project chung đã cấu hình để chạy app.

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

Script chạy không có session. Khi đã cấu hình Supabase, kiểm tra health/Hub trả 200, input Hub sai trả 400 và API bảo vệ trả 401. Khi chạy app thiếu env, bỏ `AUTH_CONFIGURED` để smoke kiểm tra phản hồi 503 ở các route phụ thuộc cấu hình. Xem [demo và kiểm thử](implementation/04_UI_AND_DEMO.md) cho các ca đăng nhập và thao tác dữ liệu.

## Quản trị Supabase

Project demo dùng schema qua migration 001–009. Khi dựng project mới, làm theo [AUTH_SETUP](AUTH_SETUP.md) để áp schema, seed và tạo tài khoản. Seed chỉ bổ sung dòng thiếu. API người dùng và browser dùng publishable key cùng session để thực thi quyền theo RLS.

## Quản trị Vercel

Project đã kết nối GitHub; production theo `main`, PR có Preview. Hai biến trong `.env.example` phải có trên môi trường cần dùng; đổi env thì redeploy. Health chỉ xác nhận app chạy, không kiểm tra database.

Khi tạo lại Vercel project: import repo, framework Next.js, root `.`, Node 24, cấu hình hai biến public và deploy bằng Git integration. Không cần workflow deploy riêng hoặc token Vercel trong GitHub Actions.

## Tham khảo

- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Vercel Git](https://vercel.com/docs/deployments/git)
