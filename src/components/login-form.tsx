import { loginAction } from "@/features/auth/login-action";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { LoginSubmitButton } from "./login-submit-button";

const loginMessages = new Map([
  ["credentials", "Không thể đăng nhập. Kiểm tra email, mật khẩu và trạng thái tài khoản."],
  ["setup", "Chưa cấu hình Supabase cho ứng dụng."],
  ["connection", "Chưa kết nối được dịch vụ đăng nhập. Vui lòng thử lại."],
  ["profile", "Chưa đọc được hồ sơ tài khoản. Vui lòng thử lại."],
  ["rate-limit", "Đã thử đăng nhập quá nhiều lần. Vui lòng đợi rồi thử lại."],
]);

export function LoginForm({ error }: { error?: string }) {
  const message = error ? loginMessages.get(error) : undefined;
  return (
    <section className="mx-auto max-w-md space-y-6">
      <h1 className="text-3xl font-bold">Đăng nhập</h1>
      <p className="text-sm text-slate-600">Sử dụng tài khoản demo do nhóm cung cấp.</p>
      <Card>
        <form action={loginAction} className="space-y-5">
          <label className="block text-sm font-medium">
            Email<Input name="email" type="email" autoComplete="username" required />
          </label>
          <label className="block text-sm font-medium">
            Mật khẩu<Input name="password" type="password" autoComplete="current-password" required />
          </label>
          {message && <p role="alert" className="text-sm text-red-700">{message}</p>}
          <LoginSubmitButton />
        </form>
      </Card>
    </section>
  );
}
