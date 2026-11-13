import Link from "next/link";
export default function AccessDenied() { return <section className="space-y-4"><h1 className="text-2xl font-bold">Không có quyền truy cập</h1><p>Tài khoản hiện tại không có vai trò phù hợp cho trang này.</p><Link href="/login" className="underline">Đổi tài khoản</Link></section>; }
