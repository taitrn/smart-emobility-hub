import Link from "next/link";

export default function NotFound() {
  return <section className="space-y-4">
    <h1 className="text-3xl font-bold">Không tìm thấy trang</h1>
    <p className="text-slate-600">Trang này chưa có trong scaffold hoặc đường dẫn không tồn tại.</p>
    <Link href="/" className="font-semibold text-teal-800 hover:underline">Về trang tổng quan</Link>
  </section>;
}
