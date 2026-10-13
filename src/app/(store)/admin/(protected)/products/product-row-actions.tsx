"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toggleVisibilityAction, archiveProductAction } from "./actions";

import { Eye, EyeOff, Trash2, Edit } from "lucide-react";
import Link from "next/link";

export function ProductRowActions({ productId, isVisible }: { productId: string; isVisible: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex gap-3 items-center">
      <Link href={`/admin/products/${productId}`} className="text-brand-action hover:text-brand-deep" title="تعديل">
        <Edit className="h-4 w-4" />
      </Link>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => { await toggleVisibilityAction(productId); router.refresh(); })}
        className="text-brand-action hover:text-brand-deep disabled:opacity-50"
        title={isVisible ? "إخفاء" : "نشر"}
      >
        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => { await archiveProductAction(productId); router.refresh(); })}
        className="text-discount-ribbon hover:opacity-80 disabled:opacity-50"
        title="حذف/أرشفة"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
