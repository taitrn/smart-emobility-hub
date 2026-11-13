# Smart E-Mobility Hub

BTL Công nghệ phần mềm HK261 · Nhóm L02_1. Một ứng dụng Next.js cho MVP quản lý Mobility Hub; thiết bị và hoạt động sạc sẽ được mô phỏng.

**Phạm vi MVP:** sáu UC chính, sạc ưu tiên đơn giản, dashboard/sự cố và các kịch bản What-if đơn giản. Nhận/trả mô phỏng kết quả ngay. Không làm Admin CRUD, phạt no-show, pending ACK/đối soát, receipt framework, history/export hoặc worker. Kế hoạch tại [bộ spec MVP](docs/implementation/README.md) là đầu vào hiện hành.

**`main` là nền làm việc của nhóm.** Các nhánh cho nhóm sẽ được tạo từ `main` sau khi chốt nền. Thành viên mở PR từ nhánh feature về `main`.

Nhận việc ở [TEAM_CHECKLIST](docs/TEAM_CHECKLIST.md), làm theo [CONTRIBUTING](docs/CONTRIBUTING.md). Hai tài liệu ngắn để ghép code là [ARCHITECTURE](docs/ARCHITECTURE.md) và [DATA_CONTRACT](docs/DATA_CONTRACT.md).

## Clone và chạy

Cần **Node.js 24 LTS** và npm. Nếu dùng nvm, chọn phiên bản ghi trong `.nvmrc`.

```sh
git clone --branch main https://github.com/taitrn/smart-emobility-hub.git
cd smart-emobility-hub
npm ci
npm run dev
```

Mở <http://localhost:3000>. Khi repo còn private, tài khoản clone cần được cấp quyền. Không cần Supabase để xem trang public; trang Student/Operator cần env và tài khoản demo.

Để chạy Auth, copy `.env.example` thành `.env.local`, điền URL/publishable key của project demo. Xem [setup Supabase và Vercel](docs/SETUP.md). Không commit `.env.local` hoặc mật khẩu.

## Phạm vi scaffold

- Next.js **16.4.6**, React **19.3.1**, TypeScript, Tailwind CSS **4.3.5**; dependency cụ thể trong `package-lock.json`.
- Shell và placeholder: Hub, lượt đặt, chuyến đi, parking, charging, Operator/What-if; trang Admin ghi chưa hỗ trợ.
- API và service có chữ ký/TODO sẵn cho sáu UC chính, sạc và dashboard. Các feature service chưa làm trả `501 NOT_IMPLEMENTED` sau khi qua kiểm tra quyền.
- Config dùng chung, types/DTO, Zod input schemas, JSON error mapping và Supabase client factories.
- `GET /api/health` kiểm tra app đang chạy, không kiểm tra database.
- GitHub Actions một job: cài dependency, lint, typecheck, contract tests và build. Không cần cloud secret cho CI. Vercel đã nối GitHub và triển khai từ `main`.

**Nền Auth/data đã chạy trên local và [production](https://smart-emobility-hub.vercel.app).** Đã kiểm tra login/logout, refresh, đổi tài khoản, chuyển hướng `/login`, role Student/Operator và RLS. Project chung đã có migration/seed và tài khoản demo. Thành viên lấy env/tài khoản riêng từ Tài; không chạy lại SQL trên project chung. [AUTH_SETUP](docs/AUTH_SETUP.md) dành cho quản trị project mới. Các use case nghiệp vụ vẫn là stub.

## Nhận việc

Đọc [scope](docs/implementation/01_SCOPE_AND_RULES.md), [dữ liệu](docs/implementation/02_ARCHITECTURE_AND_DATA.md), [API contracts](docs/implementation/03_API_CONTRACTS.md) và [Todo](docs/implementation/05_WORK_PLAN.md) theo phần được giao.

| Phần chính | Người phụ trách | Vị trí bắt đầu |
|---|---|---|
| UC01: tra cứu Hub | Tài | `src/app/(public)/hubs`, `src/features/hubs` |
| UC02/07: đặt/hủy xe | Tiến | `src/app/(student)/reservations`, `src/features/reservations` |
| UC03: nhận xe | Toàn | `src/features/rental` phần pickup |
| UC04: trả xe | Ân | `src/app/(student)/trips`, `src/features/rental` phần return |
| UC05: parking | Tài tổng hợp | `src/app/(student)/parking`, `src/features/reservations` phần parking |
| UC11: What-if | Việt Anh | `src/app/(operator)/operator/simulations`, `src/features/simulation` |
| Sạc | Việt Anh (đề xuất), Tài hỗ trợ | `src/features/charging`, `src/app/api/charging-requests` |
| Dashboard/sự cố | Ân (đề xuất), Toàn hỗ trợ | `src/features/operations`, `src/app/api/operator/overview` |

Sáu UC chính đã có service stub để owner điền; xem checklist để biết đúng file. Phân công phần hỗ trợ vẫn là đề xuất, chưa ghi nhận từng thành viên nhận việc. Auth/data đã ghép vào `main`; các bạn triển khai feature trên nền đó.

```sh
git fetch origin
git switch main
git pull --ff-only
# Sau khi nhánh được tạo và nhóm được thông báo:
git switch --track origin/feat/uc02-reservation
# Làm phần được giao, kiểm tra rồi mở PR vào main.
npm run lint
npm run typecheck
npm test
npm run build
```

Một PR theo một phần việc; ghi rõ đã làm, cách thử và phần còn thiếu. Khi đổi enum/schema dùng chung, cập nhật contract. `typecheck` chạy `next typegen` rồi `tsc --noEmit`, dùng được ngay sau clone. Test dùng Node 24 built-in runner, không thêm framework; hiện kiểm tra input boundaries, chưa kiểm thử nghiệp vụ DB.

Sau khi chạy app local, dùng `npm run smoke` để kiểm tra health, validation và request chưa đăng nhập. Khi có env Supabase, đặt `AUTH_CONFIGURED=1` cho script smoke (PowerShell: `$env:AUTH_CONFIGURED="1"`). Port khác: `npm run smoke -- http://127.0.0.1:3100`. Cập nhật smoke khi feature thay stub bằng hành vi thật.

## Cấu trúc

```text
src/app/                 # UI và API Route Handlers
src/components/          # Shell và UI chung
src/config/shared.ts     # Default nghiệp vụ/demo dùng chung
src/features/            # Service stub theo UC và người phụ trách
src/lib/domain/          # Types/DTO/input schemas chung
src/lib/http/            # API response envelope
src/lib/supabase/        # Client user-context, không dùng secret key
tests/                   # Test biên input dùng chung
scripts/smoke-api.mjs     # Smoke local, không gửi session hoặc ghi dữ liệu
supabase/                # Migration, seed và kiểm tra quyền SQL
docs/implementation/     # Scope, schema/API dự kiến, UI/demo, Todo, đối chiếu S3
.github/workflows/ci.yml
```

## Hồ sơ thiết kế và trạng thái

[Bộ spec](docs/implementation/README.md) đã đối chiếu S1–S2 Final, báo cáo Sub3 nhóm đã nộp (101 trang) và test case cá nhân. [Đối chiếu Sub3](docs/implementation/06_SUBMISSION3_ALIGNMENT.md) phân biệt yêu cầu nguồn với đề xuất đơn giản hóa MVP; chưa có bằng chứng từng owner/nhóm duyệt tất cả đề xuất.

Thiết kế Sub1–3 có thể rộng hơn MVP. Khi làm Final, cập nhật thiết kế liên quan, ghi rõ phần mô phỏng/chưa triển khai và khai báo sử dụng AI trung thực. Giữ bài đã nộp làm hồ sơ gốc.
