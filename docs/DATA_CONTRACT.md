# Các điểm ghép dùng chung

- Dùng UUID cho ID, H01/EV01 để hiển thị; JSON camelCase, DB snake_case; UTC khi lưu.
- Types tại `src/lib/domain`, default tại `src/config/shared.ts`. Các state mở rộng trong scaffold không bắt buộc code hết.
- Server xác minh session và ownership; không nhận role/userId tùy ý từ Student. Hub public không chứa mã nhận hay dữ liệu riêng tư.
- Giữ response envelope hiện có. requestId để theo dõi; chưa có receipt/exactly-once hoặc API tra retry, trừ đặt chỗ parking idempotent theo (owner_id, request_id).
- Nhận/trả mô phỏng kết quả ngay; thành công mới đổi tài nguyên, lỗi giữ nguyên. DTO command hiện có có thể dùng làm kết quả request, không cần bảng command hay trạng thái chờ.
- Parking tương lai không đổi occupancy; lịch không overlap trên cùng chỗ/xe. Chặn đặt xe trùng và tạo hai trip bằng kiểm tra/ràng buộc server.
- What-if dùng bản sao, chưa lưu lịch sử hay duyệt draft. Không tự áp dụng khuyến nghị vào dữ liệu live.

Các API entry hiện có gồm hubs, vehicle-reservations, pickup, return, parking-reservations, charging-requests, operator/overview và operator/simulations. Input sai trả 400; request được bảo vệ phải qua Auth (401/403, hoặc 503 khi thiếu cấu hình), rồi service chưa làm trả 501 (hubs và parking-reservations đã triển khai, không còn trả 501). Khi triển khai mới dùng response thành công hoặc lỗi quyền/nghiệp vụ tương ứng.

Schema tối thiểu: [mục 02](implementation/02_ARCHITECTURE_AND_DATA.md). Endpoint và output: [mục 03](implementation/03_API_CONTRACTS.md). Thuật toán và ví dụ: [mục 04](implementation/04_UI_AND_DEMO.md).
