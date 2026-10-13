import type { Metadata } from "next";
import { CartClient } from "@/components/storefront/cart-client";
import { PageTitle } from "@/components/storefront/page-title";

export const metadata: Metadata = { title: "سلة المشتريات" };

export default function CartPage() {
  return (
    <div>
      <PageTitle title="سلة المشتريات" crumb="السلة" />
      <div className="ay-container py-[40px]">
        <CartClient />
      </div>
    </div>
  );
}
