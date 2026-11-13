# 04 UI, demo và kiểm thử

## Màn hình

Dùng trang khung đã có: Hub, đăng nhập, lượt đặt, chuyến đi, parking, yêu cầu sạc và Operator/What-if. Màn Admin có thể giữ nhãn chưa hỗ trợ hoặc ẩn khỏi điều hướng; không bắt buộc triển khai riêng. Không cần đồ họa bản đồ, biểu đồ phức tạp hay giao diện điện thoại riêng.

Dữ liệu mẫu: 3 Hub (Metro, KTX, khu trường), khoảng 6–10 xe, một vài chỗ FLEET/PRIVATE và 3–4 cổng. Hai Student và một Operator quản lý cả mạng. Seed một xe pin thấp, một chỗ trả trống và một cổng hỏng để thử lỗi. Mật khẩu không commit. Một nút/reset script quản trị dùng local là đủ, không mở reset công khai.

## Sạc và sự cố

Chia hai nhóm: ưu tiên nếu pin ≤20% hoặc thời gian đến giờ rời dự kiến từ 0 đến 60 phút; các yêu cầu còn lại thuộc nhóm thường. Nhóm ưu tiên xếp trước, FIFO theo thời điểm tạo trong mỗi nhóm. Hai ngưỡng là cấu hình demo tại `src/config/shared.ts`. Cổng hỏng không được cấp phát. Operator bấm xử lý hàng đợi, hoàn tất sạc hoặc khôi phục cổng; không cần mô phỏng nhiệt độ, công suất, pause/resume hoặc scheduler nền.

## What-if đơn giản

Cho phép kết hợp nhu cầu tăng, cổng sạc bị hỏng và số xe dự kiến đến một Hub. Dùng snapshot để nhận biết riêng Hub đã đầy và Hub có nhiều xe nhất; số xe dự kiến đến chỉ mô phỏng thay đổi thêm. Tính trên bản sao trạng thái hiện tại, không sửa dữ liệu vận hành.

Một cách ước lượng đủ dùng: trong khoảng thời gian đã chọn, nhu cầu dự kiến = ceil(nhu cầu mẫu × hệ số). Thiếu xe = max(0, nhu cầu dự kiến - xe khả dụng); thiếu cổng = max(0, yêu cầu sạc - cổng còn hoạt động); xe vượt sức chứa = max(0, xe dự kiến đến - chỗ FLEET trống). Hub đầy khi không còn chỗ FLEET trống; sau kịch bản, Hub đầy nếu xe dự kiến đến lớn hơn hoặc bằng chỗ trống (kể cả Hub đã đầy và không có xe mới). Xe hiện diện là xe đang đỗ tại Hub, không tính xe đang trong chuyến. Số xe hiện diện sau kịch bản = số xe đang đỗ + min(xe dự kiến đến, chỗ FLEET trống). Trong các Hub được chọn, đánh dấu mọi Hub có số xe hiện diện sau kịch bản lớn nhất khi con số này > 0; đây là so sánh đơn giản, không tự kết luận có bất thường. Khi số xe dự kiến đến lớn hơn 0, chọn một Hub đích trong danh sách Hub đang so sánh; xe dự kiến đến là giả định, không tự trừ số xe ở Hub khác. So sánh với baseline có hệ số 1, không thêm cổng lỗi và không thêm xe dự kiến đến. Nêu rõ đây là mô hình đơn giản, không phải dự báo giao thông chính xác. Nếu xét nhiều khoảng thời gian, dùng cùng đơn vị nhu cầu/giờ và quy đổi theo horizon.

Thiếu xe thì gợi ý lấy từ Hub đang dư hoặc chuyển hướng người dùng; thiếu chỗ thì gợi ý Hub khác; thiếu cổng thì áp dụng ngưỡng pin ≤20% hoặc giờ rời trong 0–60 phút, FIFO trong cùng nhóm như mục Sạc và sự cố. Không chuyển quá số xe dư hoặc gợi ý cổng đang hỏng. Dùng bảng trước/sau và lý do bằng văn bản. Cùng snapshot/input cho cùng kết quả; seed chỉ cần dùng nếu thực sự thêm thành phần ngẫu nhiên, không bắt buộc sinh số ngẫu nhiên cho phức tạp.

## Chuỗi demo

1. Xem Hub/xe/pin/chỗ/cổng; đăng nhập Student.
2. Đặt xe; Student khác đặt cùng xe bị từ chối; thử hủy rồi đặt lại.
3. Nhập mã nhận, bắt đầu chuyến và trả vào Hub có chỗ; thử mã sai hoặc Hub đầy.
4. Đặt parking theo giờ; thử khoảng giờ sai/trùng; Operator mô phỏng đến/rời.
5. Gửi hai yêu cầu sạc, thấy thứ tự ưu tiên và cấp cổng còn trống; mô phỏng hoàn tất.
6. Operator bật cổng lỗi, xem dashboard; chạy What-if tăng nhu cầu/cổng lỗi, Hub đã đầy và xe tập trung tại một Hub; đọc bảng thay đổi và khuyến nghị. Xác nhận xe/chỗ thực tế không tự đổi.

## Kiểm thử và báo cáo

Dùng 12 test case đã nộp làm tài liệu tham khảo, đánh dấu rõ ca chưa hỗ trợ vì scope giảm; không tự ghi pass toàn bộ. Ít nhất thử luồng thành công của từng phần, đặt trùng, mã sai/hết hạn, trả Hub đầy, parking trùng, cổng lỗi và request trái quyền. Test chức năng có thật, không tăng số lượng test cho đẹp.

Một tính năng xong khi UI gọi API/service thật, thay đổi dữ liệu đúng, có thể demo lại từ seed và owner giải thích được. Các mục tiêu 500 users, uptime hoặc độ trễ trong báo cáo cũ chưa được chứng minh bằng demo thủ công. Final cần PDF tổng hợp, chuỗi màn hình hoạt động, slide/demo được tập trước và khai báo AI trung thực theo spec.
