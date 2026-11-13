import Link from "next/link";

type Props = {
  title: string;
  useCase: string;
  description: string;
  requirements: string[];
};

export function FeaturePlaceholder({ title, useCase, description, requirements }: Props) {
  return (
    <section className="max-w-3xl space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">{useCase}</p>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="leading-7 text-slate-600">{description}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold">Nội dung cần triển khai</h2>
        <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-6 text-slate-600">
          {requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}
        </ul>
      </div>
      <p className="text-sm leading-6 text-slate-500">
        Chưa có dữ liệu hay thao tác thật trên trang này. Khi triển khai, kiểm tra quyền với từng tài nguyên trước khi đọc hoặc ghi dữ liệu.
      </p>
      <Link href="/" className="inline-block text-sm font-semibold text-teal-800 hover:underline">← Trang tổng quan</Link>
    </section>
  );
}
