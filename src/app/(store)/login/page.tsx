import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "./login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تسجيل الدخول | Smart Line Admin",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-navy px-4">
      <div className="w-full max-w-sm rounded-section bg-white p-8">
        <h1 className="mb-1 text-xl font-bold text-text-primary">تسجيل الدخول للوحة التحكم</h1>
        <p className="mb-6 text-sm text-text-muted">Smart Line Admin</p>
        <LoginForm />
      </div>
    </div>
  );
}
