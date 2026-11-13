# Kiến trúc MVP

Một Next.js app: page → API route → feature service → Supabase Auth/PostgreSQL. Giữ cấu trúc hiện có, không thêm layer/framework.

- `src/features/`: sáu UC chính; các service đang là stub.
- `src/lib/domain`, `src/config`: types và quy tắc chung.
- `src/lib/http`: validation/error envelope; `requestId` chỉ để theo dõi.
- `src/lib/auth`, `src/lib/supabase`: chờ nối tài khoản demo và quyền dữ liệu.
- `supabase/`: migration/seed thêm dần khi làm feature.

Nhận/trả mô phỏng kết quả ngay. Sạc theo ưu tiên đơn giản, Operator bấm xử lý. What-if tính trên bản sao dữ liệu, trả bảng so sánh và khuyến nghị. Không có worker, command queue, receipt service hay engine simulation nhiều bước.

[Checklist](TEAM_CHECKLIST.md) ghi phân công. [Mục 02](implementation/02_ARCHITECTURE_AND_DATA.md) ghi dữ liệu/quyền; [mục 03](implementation/03_API_CONTRACTS.md) ghi API. UI placeholder chưa có Auth hoặc nghiệp vụ thật.
