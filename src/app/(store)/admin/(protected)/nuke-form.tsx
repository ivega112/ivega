"use client";

import { useTransition } from "react";
import { nukeProductsAndOrdersAction } from "./nuke-action";
import { useRouter } from "next/navigation";

export function NukeForm() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="mt-8 rounded-card border border-discount-ribbon bg-discount-ribbon/5 p-6 text-center">
      <h2 className="text-lg font-bold text-discount-ribbon">منطقة الخطر (حذف جميع المنتجات والطلبات)</h2>
      <p className="mt-2 text-sm text-text-secondary">
        سيتم مسح جميع المنتجات والطلبات من قاعدة البيانات نهائياً. الشركات والأقسام ستبقى كما هي.
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm("هل أنت متأكد تماماً من حذف جميع المنتجات والطلبات؟ هذا الإجراء لا يمكن التراجع عنه.")) {
            startTransition(async () => {
              await nukeProductsAndOrdersAction();
              alert("تم الحذف بنجاح!");
              router.refresh();
            });
          }
        }}
        className="mt-4 h-10 rounded-control bg-discount-ribbon px-6 font-semibold text-white disabled:opacity-50 hover:bg-discount-ribbon/90"
      >
        {pending ? "جارٍ الحذف..." : "تأكيد مسح جميع المنتجات والطلبات"}
      </button>
    </div>
  );
}
