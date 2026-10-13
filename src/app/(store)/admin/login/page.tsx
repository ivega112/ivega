import { redirect } from "next/navigation";

/**
 * Legacy redirect — the canonical login URL is now /login.
 * Kept here so any bookmarked /admin/login links still work.
 */
export default function AdminLoginRedirect() {
  redirect("/login");
}
