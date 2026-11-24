# 04 UI, demo và kiểm thử

## Giao diện

Trang chủ, Hub và các màn hình Student/Operator dùng chung sidebar, header, form và trạng thái. Sidebar hiển thị chức năng theo role. Ở màn chọn xe (`/reservations/new`), bấm bất kỳ ô nào trên hàng xe khả dụng hoặc dùng nút mã xe bằng bàn phím. `/reservations` hiển thị lượt đang giữ và lịch sử.

## Dữ liệu mẫu

Seed sạch có 3 Hub (Ga Metro, Ký túc xá, Khu trường), 7 xe chung, 14 chỗ đỗ (10 FLEET, 4 PRIVATE) và 3 cổng sạc. Tài khoản demo và xe cá nhân `DEMO-01` tạo riêng theo [hướng dẫn quản trị](../AUTH_SETUP.md).

| Dữ liệu | Kịch bản |
|---|---|
| `EV01`, pin 75% ở H01 | Đặt/hủy, nhận và trả xe vào chỗ FLEET trống |
| `EV07`, xe máy điện pin 15%, đỗ ở `H01-S5` | Lọc loại xe/pin hoặc minh họa ưu tiên sạc vì pin thấp |
| `H01-S6`, chỗ PRIVATE trống | Đặt chỗ cho xe cá nhân, thử trùng lịch hoặc mô phỏng vào/ra |
| `CP01` hoạt động và `CP03` hỏng | Cấp cổng, hoàn tất sạc và minh họa sự cố |

Tọa độ chỉ để minh họa. Dữ liệu trên là trạng thái lúc seed. Các dòng mới đã được thử trên database tạm. Khi dùng project chung để demo, kiểm tra đã có EV07 và H01-S6, rồi kiểm tra trạng thái xe/chỗ/cổng trước khi chạy kịch bản.

## Chuỗi demo ngắn

1. Tra cứu Hub rồi đăng nhập Student. Đặt `EV01`, hủy, đặt lại, nhập mã nhận và trả xe vào một chỗ FLEET trống.
2. Đặt `H01-S6` cho xe cá nhân trong khung giờ phù hợp. Thử đặt trùng một lần. Khi tới khung giờ, dùng tài khoản Operator ghi nhận đến/rời.
3. Khi `CP01` trống và hai xe cùng khả dụng ở H01, gửi yêu cầu sạc `EV01` trước, `EV07` sau, bỏ trống giờ rời dự kiến. Operator cấp cổng; `EV07` được cấp trước do pin ≤20%. Hoàn tất rồi cấp cho lượt còn lại.
4. Trên dashboard, giả lập lỗi và khôi phục xe/cổng. Chạy What-if với nhiều xe đến hơn số chỗ FLEET trống và thêm một cổng lỗi. Đối chiếu số liệu trước/sau, xe vượt sức chứa và khuyến nghị.

## Kết quả kiểm tra

Rà lại nhánh UI và dữ liệu mẫu ngày 25/11/2026.

| Môi trường | Đã xác minh |
|---|---|
| Nhánh UI trên localhost | Mở các màn hình Student và Operator, kiểm tra điều hướng theo role, chọn xe bằng cách bấm ô pin hoặc nhấn Space trên nút mã xe. Chạy thử What-if qua UI. Lint, typecheck và 26 test Node đã qua. |
| Production build local | Webpack build thành công trên Node 24. Smoke API qua 15/15 ca cho health, Hub và Auth khi chưa đăng nhập. Turbopack gặp lỗi khởi chạy tiến trình Node con trong môi trường chạy kiểm thử. |
| PostgreSQL tạm (PGlite) | Áp 001–009, seed và 5 file test SQL cho Auth/RLS, đặt/hủy xe, trả xe và parking. Với `H01-S6`, thử đặt chỗ, từ chối trùng và ghi nhận vào/ra. `EV07` được cấp cổng trước yêu cầu thường. Chạy lại seed giữ trạng thái đang sạc. Hoàn tất yêu cầu và cấp lại cổng cho xe tiếp theo. |
| Bản Vercel trước cập nhật UI | Đã thử tra cứu Hub, quyền Student/Operator, đặt/hủy và nhận/trả xe, từ chối mã nhận sai, hàng đợi sạc, giả lập lỗi và khôi phục xe/cổng, và What-if. |

## Giới hạn

- Nhận/trả xe và trạng thái sạc là mô phỏng. Hoàn tất phiên sạc giải phóng cổng, giữ nguyên mức pin. Form sạc hiện chọn xe dùng chung.
- Parking cần Operator ghi nhận đến/rời. Bản demo chưa tự xử lý no-show hay xe chiếm chỗ quá giờ.
- What-if tính trên snapshot với nhu cầu mẫu và chỉ đưa ra khuyến nghị. Hàng đợi ưu tiên pin thấp hoặc xe sắp rời trong 0–60 phút, theo FIFO trong mỗi nhóm.
- Kiểm tra hiện tập trung vào luồng chức năng, quyền và giao dịch. Chưa đo tải đồng thời, độ trễ hay uptime.
