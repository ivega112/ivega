import type { Metadata } from "next";
import { CheckoutReviewClient } from "@/components/storefront/checkout-review-client";

export const metadata: Metadata = { title: "مراجعة الطلب" };

export default function CheckoutReviewPage() {
  return (
    <div className="ay-container py-8 ">
      <h1 className="mb-6 text-2xl font-bold text-ay-title">مراجعة الطلب</h1>
      <CheckoutReviewClient />
    </div>
  );
}
