# Các điểm ghép dùng chung

- Dùng UUID cho ID, H01/EV01 để hiển thị; JSON camelCase, DB snake_case; UTC khi lưu.
- Types tại `src/lib/domain`, default tại `src/config/shared.ts`. Các trạng thái đang dùng được ghi trong [phạm vi MVP](implementation/01_SCOPE_AND_RULES.md).
- Server xác minh session và ownership; không nhận role/userId tùy ý từ Student. Hub public không chứa mã nhận hay dữ liệu riêng tư.
- Giữ response envelope hiện có. `requestId` để theo dõi. Các thao tác đặt xe, đặt chỗ và gửi yêu cầu sạc có kiểm tra retry theo người dùng và payload.
- Nhận/trả mô phỏng kết quả ngay; thành công mới đổi tài nguyên, lỗi giữ nguyên. DTO command hiện có có thể dùng làm kết quả request, không cần bảng command hay trạng thái chờ.
- Parking tương lai không đổi occupancy; lịch không overlap trên cùng chỗ/xe. Chặn đặt xe trùng và tạo hai trip bằng kiểm tra/ràng buộc server.
- What-if dùng bản sao, chưa lưu lịch sử hay duyệt draft. Không tự áp dụng khuyến nghị vào dữ liệu live.

API bảo vệ kiểm tra session và quyền trước khi xác thực input. Mã phản hồi thường gặp gồm 400 cho input sai, 401/403 cho lỗi session/quyền, 404 cho dữ liệu không tìm thấy, 409 cho xung đột và 503 khi thiếu kết nối hoặc cấu hình.

Schema tối thiểu: [mục 02](implementation/02_ARCHITECTURE_AND_DATA.md). Endpoint và output: [mục 03](implementation/03_API_CONTRACTS.md). Thuật toán và ví dụ: [mục 04](implementation/04_UI_AND_DEMO.md).
