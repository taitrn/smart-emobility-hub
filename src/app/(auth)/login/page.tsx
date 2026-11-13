import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-md space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">UC14 · Authentication</p>
        <h1 className="text-3xl font-bold">Đăng nhập</h1>
        <p className="text-sm leading-6 text-slate-600">Form placeholder. Chức năng đăng nhập và phân quyền theo tài khoản Supabase sẽ được ghép ở bước Auth.</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <form>
        <fieldset disabled className="space-y-5">
          <legend className="sr-only">Thông tin đăng nhập — chưa khả dụng</legend>
          <label className="block text-sm font-medium">Email<input type="email" autoComplete="username" className="mt-2 block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2" /></label>
          <label className="block text-sm font-medium">Mật khẩu<input type="password" autoComplete="current-password" className="mt-2 block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2" /></label>
          <button type="button" className="w-full rounded-lg bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-500">Chưa triển khai</button>
        </fieldset>
        </form>
      </div>
      <p className="text-sm leading-6 text-slate-500">{isSupabaseConfigured() ? "Đã khai báo biến môi trường Supabase; chưa xác minh kết nối hoặc đăng nhập." : "Chưa cấu hình Supabase. Bạn vẫn có thể xem các trang placeholder."}</p>
    </section>
  );
}
