"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { ok: false };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      router.push("/admin");
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <label htmlFor="admin-email" className="mb-1 block text-sm text-text-secondary">البريد الإلكتروني</label>
        <input id="admin-email" name="email" type="email" required dir="ltr" className="h-11 w-full rounded-control border border-border px-3 text-sm" />
      </div>
      <div>
        <label htmlFor="admin-password" className="mb-1 block text-sm text-text-secondary">كلمة المرور</label>
        <input id="admin-password" name="password" type="password" required className="h-11 w-full rounded-control border border-border px-3 text-sm" />
      </div>
      {state.error && <p role="alert" className="text-xs text-discount-ribbon">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 h-11 rounded-control bg-brand-action text-sm font-semibold text-white hover:bg-brand-action-hover disabled:opacity-60"
      >
        {pending ? "جارٍ الدخول…" : "دخول"}
      </button>
    </form>
  );
}
