"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteUserAction, resetUserPasswordAction, updateUserDetailsAction, type UserActionState } from "./actions";

const initialState: UserActionState = { ok: false };

export function UserRow({ user, isSelf }: { user: { id: string; name: string; email: string }; isSelf: boolean }) {
  const router = useRouter();
  const [detailsState, detailsAction, detailsPending] = useActionState(updateUserDetailsAction, initialState);
  const [pwState, pwAction, pwPending] = useActionState(resetUserPasswordAction, initialState);
  const [showEdit, setShowEdit] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [pending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function deleteUser() {
    if (isSelf || !window.confirm(`حذف المستخدم ${user.name} نهائياً؟`)) return;
    startTransition(async () => {
      setDeleteError(null);
      try {
        await deleteUserAction(user.id);
        router.refresh();
      } catch (error) {
        setDeleteError(error instanceof Error ? error.message : "تعذّر حذف المستخدم");
      }
    });
  }

  return (
    <tr className="border-t border-border-light align-top">
      <td className="p-3">
        <span className="block font-medium text-text-primary">{user.name}</span>
        <span dir="ltr" className="block text-xs text-text-faint">{user.email}</span>
        {isSelf && <span className="text-[10px] text-brand-action">(أنت)</span>}
      </td>
      <td className="p-3">
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setShowEdit((value) => !value)} className="rounded border border-border px-2 py-1 text-xs">تعديل البيانات</button>
          <button type="button" onClick={() => setShowReset((value) => !value)} className="rounded border border-border px-2 py-1 text-xs">إعادة تعيين كلمة المرور</button>
          <button type="button" onClick={deleteUser} disabled={isSelf || pending} title={isSelf ? "لا يمكن حذف الحساب المستخدم حالياً" : undefined} className="rounded border border-discount-ribbon px-2 py-1 text-xs text-discount-ribbon disabled:cursor-not-allowed disabled:opacity-40">حذف</button>
        </div>

        {showEdit && (
          <form action={detailsAction} className="mt-3 grid gap-2 sm:grid-cols-2">
            <input type="hidden" name="userId" value={user.id} />
            <input name="name" defaultValue={user.name} placeholder="الاسم" required className="input" />
            <input name="email" type="email" defaultValue={user.email} placeholder="البريد الإلكتروني" dir="ltr" required className="input" />
            <button type="submit" disabled={detailsPending} className="h-9 w-fit rounded-control bg-brand-action px-4 text-xs font-semibold text-white disabled:opacity-60">حفظ البيانات</button>
          </form>
        )}
        {detailsState.error && <p role="alert" className="mt-1 text-[11px] text-discount-ribbon">{detailsState.error}</p>}
        {detailsState.ok && <p role="status" className="mt-1 text-[11px] text-stock-in-text">تم تحديث البيانات</p>}

        {showReset && (
          <form action={pwAction} className="mt-3 flex flex-wrap items-center gap-2">
            <input type="hidden" name="userId" value={user.id} />
            <input name="password" type="password" placeholder="كلمة مرور جديدة" minLength={12} required className="input max-w-xs" />
            <button type="submit" disabled={pwPending} className="h-9 rounded-control bg-brand-deep px-3 text-xs font-semibold text-white disabled:opacity-60">حفظ كلمة المرور</button>
          </form>
        )}
        {pwState.error && <p role="alert" className="mt-1 text-[11px] text-discount-ribbon">{pwState.error}</p>}
        {pwState.ok && <p role="status" className="mt-1 text-[11px] text-stock-in-text">تم تحديث كلمة المرور</p>}
        {deleteError && <p role="alert" className="mt-1 text-[11px] text-discount-ribbon">{deleteError}</p>}
      </td>
    </tr>
  );
}
