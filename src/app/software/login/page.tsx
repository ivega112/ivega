import { getSession } from "@/software-lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "@/app/software/admin/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تسجيل دخول الإدارة | iVEGA Software",
  robots: { index: false, follow: false },
};

/**
 * Standalone login page at /software/login.
 * Redirects to /admin if the admin is already authenticated.
 */
export default async function SoftwareLoginPage() {
  const session = await getSession();
  if (session?.adminId) redirect("/software/admin");

  return <LoginForm />;
}
