"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmOrderAction, setOrderStatusAction } from "./[id]/actions";

export function OrderRowAction({ orderId, status }: { orderId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (status === "PENDING_WHATSAPP" || status === "CONTACTED") {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={(e) => {
          e.preventDefault();
          startTransition(async () => {
            const res = await confirmOrderAction(orderId);
            if (res.ok) await setOrderStatusAction(orderId, "PREPARING");
            router.refresh();
          });
        }}
        className="rounded-control bg-brand-action px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
      >
        بدء التجهيز
      </button>
    );
  }

  if (status === "CONFIRMED") {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={(e) => {
          e.preventDefault();
          startTransition(async () => {
            await setOrderStatusAction(orderId, "PREPARING");
            router.refresh();
          });
        }}
        className="rounded-control bg-brand-action px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
      >
        بدء التجهيز
      </button>
    );
  }

  if (status === "PREPARING") {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={(e) => {
          e.preventDefault();
          startTransition(async () => {
            await setOrderStatusAction(orderId, "OUT_FOR_DELIVERY");
            router.refresh();
          });
        }}
        className="rounded-control bg-brand-action px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
      >
        تسليم للمندوب
      </button>
    );
  }

  if (status === "OUT_FOR_DELIVERY") {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={(e) => {
          e.preventDefault();
          startTransition(async () => {
            await setOrderStatusAction(orderId, "COMPLETED");
            router.refresh();
          });
        }}
        className="rounded-control bg-whatsapp px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
      >
        تأكيد التوصيل
      </button>
    );
  }

  return <span className="text-xs text-text-faint">—</span>;
}
