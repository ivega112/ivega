"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { logoutAction } from "./actions";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await logoutAction();
          router.push("/admin/login");
          router.refresh();
        })
      }
      className="rounded-lg px-3 py-2 text-start text-sm text-[#a9c2e0] hover:bg-[#0e2e52] hover:text-white"
    >
      تسجيل الخروج
    </button>
  );
}
