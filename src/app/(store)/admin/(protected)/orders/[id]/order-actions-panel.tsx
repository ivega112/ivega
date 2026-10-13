"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmOrderAction, cancelOrderAction, setOrderStatusAction } from "./actions";

export function OrderActionsPanel({ orderId, status }: { orderId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function confirm() {
    setError(null);
    startTransition(async () => {
      const res = await confirmOrderAction(orderId);
      if (!res.ok) {
        setError(res.error ?? "خطأ");
        return;
      }
      // Automatically advance to PREPARING after confirming inventory
      await setOrderStatusAction(orderId, "PREPARING");
      router.refresh();
    });
  }

  function changeStatus(newStatus: "CONTACTED" | "PREPARING" | "OUT_FOR_DELIVERY" | "COMPLETED") {
    setError(null);
    startTransition(async () => {
      const res = await setOrderStatusAction(orderId, newStatus);
      if (!res.ok) setError(res.error ?? "خطأ");
      router.refresh();
    });
  }

  function cancel() {
    setError(null);
    startTransition(async () => {
      await cancelOrderAction(orderId);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-discount-ribbon">{error}</span>}
      
      {(status === "PENDING_WHATSAPP" || status === "CONTACTED") && (
        <button
          type="button"
          disabled={pending}
          onClick={confirm}
          className="h-10 rounded-control bg-brand-action px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          تأكيد وبدء التجهيز
        </button>
      )}

      {status === "CONFIRMED" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => changeStatus("PREPARING")}
          className="h-10 rounded-control bg-brand-action px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          البدء بالتجهيز
        </button>
      )}

      {status === "PREPARING" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => changeStatus("OUT_FOR_DELIVERY")}
          className="h-10 rounded-control bg-brand-action px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          تسليم للمندوب (قيد التوصيل)
        </button>
      )}

      {status === "OUT_FOR_DELIVERY" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => changeStatus("COMPLETED")}
          className="h-10 rounded-control bg-whatsapp px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          مؤكد وتم التوصيل
        </button>
      )}

      {status !== "CANCELLED" && status !== "COMPLETED" && (
        <button
          type="button"
          disabled={pending}
          onClick={cancel}
          className="h-10 rounded-control border border-discount-ribbon px-4 text-sm font-semibold text-discount-ribbon disabled:opacity-60"
        >
          إلغاء الطلب
        </button>
      )}
    </div>
  );
}
