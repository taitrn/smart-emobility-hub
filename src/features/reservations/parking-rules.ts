import { SHARED_CONFIG } from "../../config/shared.ts";
export function validParkingOffset(value: string) {
  const m = value.match(/([+-])(\d{2}):(\d{2})$/);
  return (
    !m ||
    (Number(m[2]) < 14 && Number(m[3]) < 60) ||
    (Number(m[2]) === 14 && m[3] === "00")
  );
}
export function parkingWindowError(
  start: string,
  end: string,
  now = Date.now(),
) {
  const from = Date.parse(start),
    to = Date.parse(end);
  if (!Number.isFinite(from) || !Number.isFinite(to))
    return "Ngày giờ không hợp lệ.";
  if (to <= from) return "Giờ kết thúc phải sau giờ bắt đầu.";
  if (to - from < SHARED_CONFIG.reservation.minimumParkingMinutes * 60000)
    return "Khoảng đặt phải dài ít nhất 30 phút.";
  if (to - from > SHARED_CONFIG.reservation.maximumParkingHours * 3600000)
    return "Mỗi lượt đặt tối đa 24 giờ.";
  if (
    from >
    now + SHARED_CONFIG.reservation.maximumParkingAdvanceDays * 86400000
  )
    return "Chỉ được đặt trước tối đa 30 ngày.";
  return null;
}
// The project's configured UI zone is UTC+07, without daylight saving time.
export function parkingInputToUtc(value: string) {
  return value ? new Date(value + "+07:00").toISOString() : "";
}
export function parkingDisplay(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    timeZone: SHARED_CONFIG.ui.timeZone,
  });
}
