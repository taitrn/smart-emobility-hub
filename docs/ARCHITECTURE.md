# Kiến trúc MVP

Một ứng dụng Next.js App Router dùng TypeScript, Tailwind CSS và Supabase Auth/PostgreSQL. Vercel triển khai từ `main`. GitHub Actions chạy lint, typecheck, test Node và build.

| Phần | Trách nhiệm |
|---|---|
| `src/app` | Page, layout theo vai trò và API Route Handlers |
| `src/components` | Shell điều hướng theo vai trò, form và component UI chung |
| `src/features` | Tra cứu Hub, đặt/hủy xe, nhận/trả xe, parking, sạc, dashboard và What-if |
| `src/lib/auth`, `src/lib/supabase` | Session, guard và Supabase client theo user |
| `src/lib/domain`, `src/config` | Kiểu dữ liệu, validation và quy tắc dùng chung |
| `supabase` | Migration 001–009, seed và test SQL |

Layout kiểm tra quyền truy cập trang. API kiểm tra session/role khi nhận request. PostgreSQL dùng RLS để giới hạn truy cập bản ghi và transaction/RPC cho thao tác cập nhật nhiều bảng. Operator demo quản lý toàn mạng Hub.

Nhận/trả xe trả kết quả giả lập ngay. Hàng đợi sạc được xử lý khi có yêu cầu hoặc Operator thao tác. What-if tính trên snapshot và trả so sánh hoặc khuyến nghị. Các giới hạn được ghi tại [demo và kiểm thử](implementation/04_UI_AND_DEMO.md).

Xem [dữ liệu](implementation/02_ARCHITECTURE_AND_DATA.md) và [API](implementation/03_API_CONTRACTS.md).
