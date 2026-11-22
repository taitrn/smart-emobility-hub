"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./ui/button";

export function LoginSubmitButton() {
  const { pending } = useFormStatus();
  return <Button disabled={pending} className="w-full">{pending ? "Đang đăng nhập…" : "Đăng nhập"}</Button>;
}
