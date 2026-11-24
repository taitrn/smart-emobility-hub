import Link from "next/link";

export default function NotFound() {
  return <section className="app-surface max-w-xl space-y-4">
    <h1 className="text-3xl font-bold">Không tìm thấy trang</h1>
    <p className="app-muted">Trang này chưa có trong scaffold hoặc đường dẫn không tồn tại.</p>
    <Link href="/" className="app-secondary">Về trang tổng quan</Link>
  </section>;
}
