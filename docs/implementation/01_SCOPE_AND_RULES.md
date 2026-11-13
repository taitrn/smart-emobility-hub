# 01 Phạm vi MVP

## Chức năng cần có

| Phần | Đầu ra để demo |
|---|---|
| UC01 | Danh sách/chi tiết Hub; xe và pin, chỗ trống, cổng sạc |
| UC02/07 | Đặt một xe còn trống; xem và hủy lượt đặt của mình |
| UC03 | Nhập mã nhận; mô phỏng mở khóa thành công hoặc lỗi; bắt đầu chuyến |
| UC04 | Chọn Hub/chỗ trả còn trống; mô phỏng khóa; kết thúc chuyến |
| UC05 | Đặt chỗ PRIVATE theo giờ; chặn lịch trùng; mô phỏng đến/rời |
| Sạc | Gửi yêu cầu; ưu tiên xe pin ≤20% hoặc rời trong 0–60 phút; FIFO trong cùng nhóm; cấp cổng còn trống |
| Operator | Xem số lượng xe/chỗ/cổng; giả lập cổng hỏng hoặc xe lỗi và khôi phục |
| UC11 | Thử tăng nhu cầu, hỏng cổng, Hub đầy hoặc xe tập trung tại một Hub; so sánh trước/sau và đưa khuyến nghị |
| Đăng nhập | Tài khoản demo Student và Operator; Admin chưa cần màn hình riêng |

Dashboard và sạc là phần hỗ trợ cần demo, không được bỏ chỉ vì không thuộc sáu UC cá nhân. Phần quản trị ban đầu thực hiện bằng seed/Dashboard Supabase. Operator demo được quản lý cả ba Hub; chưa làm phân quyền riêng từng Hub.

## Quy tắc tối thiểu

1. Chỉ đặt xe AVAILABLE ở Hub đang hoạt động. Mỗi Student có một lượt đặt hoặc chuyến đang chạy; không để hai người giữ cùng xe.
2. Giữ xe 15 phút từ lúc đặt. Server kiểm tra hạn khi nhận/hủy; chưa cần cron. Đây là quy tắc demo kế thừa thiết kế nhóm, không phải con số cô bắt buộc.
3. Chỉ chủ lượt đặt/chuyến được nhận, hủy hoặc trả. Không tin user/role gửi trong body.
4. Mô phỏng thiết bị trả kết quả ngay trong request. Thành công mới đổi trạng thái; lỗi giữ nguyên dữ liệu. Chưa hỗ trợ trạng thái chờ đối soát hoặc offline.
5. Trả xe vào FLEET còn trống. PRIVATE dành cho lịch xe cá nhân; đặt lịch tương lai không làm chỗ đang trống thành đang có xe.
6. Parking có end > start, tối thiểu 30 phút và start không trong quá khứ. Chặn overlap trên cùng chỗ và cùng xe; lịch liền nhau được phép. Giờ do server kiểm tra.
7. Xe/cổng lỗi không được cấp phát. Cổng chỉ phục vụ một phiên; nhóm ưu tiên gồm xe pin ≤20% hoặc rời trong 0–60 phút; nhóm này xếp trước nhóm còn lại, FIFO theo thời điểm yêu cầu trong mỗi nhóm. Ngưỡng là cấu hình demo.
8. What-if tính trên bản sao dữ liệu. Kết quả là khuyến nghị để Operator xem, không tự sửa xe, chỗ hoặc lịch sạc thật.

## Trạng thái dùng trong luồng demo

- Xe: AVAILABLE → RESERVED → IN_USE → AVAILABLE; WAITING_CHARGE/CHARGING nếu mô phỏng sạc; OUT_OF_SERVICE khi lỗi.
- Lượt đặt xe: ACTIVE_HOLD → FULFILLED, CANCELLED hoặc EXPIRED.
- Chuyến: ACTIVE → COMPLETED.
- Parking: CONFIRMED → CHECKED_IN → COMPLETED hoặc CANCELLED.
- Sạc: WAITING → CHARGING → COMPLETED.

Các union khác còn trong scaffold chỉ phục vụ tương thích thiết kế, không bắt buộc hiện thực tất cả trạng thái. Khi chốt mỗi feature, giữ lại đúng những trạng thái sử dụng.

## Để sau

Không bắt buộc no-show/phạt khóa tài khoản, receipt/retry tổng quát, pending ACK/đối soát, incident workflow, duyệt draft, lịch sử simulation, export, CRUD thiết bị/tài khoản, SSO, IoT thật, worker, Realtime hoặc load test. Thiết kế trong bài cũ có thể rộng hơn phần MVP, phải ghi rõ khi báo cáo.
