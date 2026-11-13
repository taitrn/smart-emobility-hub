import Link from "next/link";

const sections = [
  { href: "/hubs", title: "Tra cứu Mobility Hub", detail: "Hub, xe, chỗ đỗ và cổng sạc · UC01" },
  { href: "/reservations", title: "Đặt và nhận xe", detail: "Lượt đặt xe, mã nhận và thời hạn · UC02–03" },
  { href: "/trips", title: "Chuyến đi và trả xe", detail: "Chuyến đang hoạt động và xác nhận trả · UC04" },
  { href: "/parking", title: "Đặt chỗ đỗ cá nhân", detail: "Chọn Hub và khoảng thời gian · UC05" },
  { href: "/operator", title: "Vận hành Hub", detail: "Thiết bị, sạc và sự cố · Operator" },
  { href: "/operator/simulations", title: "What-if Simulation", detail: "Kịch bản trên snapshot, không đổi dữ liệu live · UC11" },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="max-w-3xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">MVP · Nhóm L02_1</p>
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Quản lý di chuyển và sạc xe tại Mobility Hub</h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-600">Khung ứng dụng chung cho nhóm phát triển: tra cứu Hub, đặt xe, nhận và trả xe, đặt chỗ đỗ và mô phỏng vận hành.</p>
        <p className="text-sm leading-6 text-slate-500">Chọn một mục để xem phạm vi cần làm. Các use case sẽ được bổ sung theo Todo trong repo.</p>
      </section>
      <section aria-label="Các chức năng" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map(({ href, title, detail }) => (
          <Link key={href} href={href} className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-teal-500 hover:shadow-sm">
            <h2 className="font-semibold">{title} <span aria-hidden="true">→</span></h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
