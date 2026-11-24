import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { PageHeading } from "@/components/ui/workspace";

const actions = [
  ["/reservations/new", "Đặt xe dùng chung", "Chọn xe điện còn trống tại Hub.", "bike"],
  ["/parking", "Đỗ xe cá nhân", "Đặt chỗ theo thời gian bạn cần.", "parking"],
  ["/charging", "Đăng ký sạc", "Gửi yêu cầu sạc tại Hub.", "charge"],
  ["/trips", "Chuyến đi", "Xem chuyến đang diễn ra và trả xe.", "key"],
] as const;

export default function HomePage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Di chuyển trong khu đô thị ĐHQG-HCM"
        description="Tra cứu Mobility Hub, đặt xe điện dùng chung, đặt chỗ đỗ và đăng ký sạc."
      />
      <section aria-label="Tra cứu Hub" className="app-surface flex flex-wrap items-center justify-between gap-4 bg-[#153f34] text-white">
        <div className="space-y-1">
          <h2 className="text-lg font-bold">Tìm Hub cho hành trình</h2>
          <p className="text-sm text-[#dce7df]">Xem xe khả dụng, mức pin, chỗ đỗ và cổng sạc tại mỗi Hub.</p>
        </div>
        <Link href="/hubs" className="app-secondary"><Icon name="pin" /> Tra cứu Hub &amp; xe</Link>
      </section>
      <section aria-labelledby="student-actions" className="space-y-3">
        <h2 id="student-actions" className="app-subtitle">Dịch vụ sinh viên</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {actions.map(([href, title, detail, icon]) => (
            <Link key={href} href={href} className="app-surface space-y-3 hover:border-[#147a59] hover:bg-[#f4faf7]">
              <span className="grid size-10 place-items-center rounded-lg bg-[#e6f2ec]"><Icon name={icon} /></span>
              <h3 className="app-subtitle">{title}</h3>
              <p className="app-muted">{detail}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
