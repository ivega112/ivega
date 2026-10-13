"use client";

import { useActionState } from "react";
import { createUserAction, type UserActionState } from "./actions";

const initialState: UserActionState = { ok: false };

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createUserAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-card border border-border bg-white p-5">
      <span className="text-sm font-semibold text-text-primary">مستخدم جديد</span>
      <input name="name" placeholder="الاسم الكامل" required className="input" />
      <input name="email" type="email" placeholder="البريد الإلكتروني" dir="ltr" required className="input" />
      <input name="password" type="password" placeholder="كلمة المرور (12 حرفاً على الأقل)" required minLength={12} className="input" />
      {state.error && <p role="alert" className="text-sm text-discount-ribbon">{state.error}</p>}
      {state.ok && <p role="status" className="text-sm text-stock-in-text">تم إنشاء المستخدم</p>}
      <button type="submit" disabled={pending} className="h-10 w-fit rounded-control bg-brand-action px-5 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? "جارٍ الإنشاء…" : "إنشاء"}
      </button>
    </form>
  );
}
