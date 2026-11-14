# Kiến trúc MVP

Một Next.js app: page → API route → feature service → Supabase Auth/PostgreSQL.

| Phần | Hiện trạng |
|---|---|
| Auth, Proxy, server guard và `/api/me` | Đã chạy local và production; Student/Operator có quyền riêng |
| `supabase/` | Migration 001–004 và seed nền đã áp trên project chung (002–004 cho parking); RLS đã thử |
| `src/features/` | UC01 (Hub) và UC05 (parking) đã triển khai; các UC còn lại, sạc và dashboard có service stub |
| `src/lib/domain`, `src/config` | Types và quy tắc dùng chung |
| `src/lib/http` | JSON envelope, validation và lỗi; requestId để theo dõi |
| `src/components/ui` | Button/Input/Card Tailwind dùng chung; chưa cài shadcn |

Student/Operator layouts kiểm tra quyền trang; API kiểm tra lại quyền trực tiếp. Proxy refresh session, không thay thế guard/RLS. Operator demo quản lý cả mạng; chưa phân quyền theo từng Hub. Trang Admin chỉ ghi chưa hỗ trợ.

Khi triển khai, nhận/trả mô phỏng kết quả ngay, sạc theo ưu tiên đơn giản, What-if tính trên bản sao. Không dùng worker, command queue hay receipt framework.

[Checklist](TEAM_CHECKLIST.md) là nguồn phân công; [mục 02](implementation/02_ARCHITECTURE_AND_DATA.md) ghi dữ liệu, [mục 03](implementation/03_API_CONTRACTS.md) ghi API. Bảng nghiệp vụ thêm cùng feature.
