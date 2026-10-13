import { redirect } from "next/navigation";

// The Offers page was merged into "/shop" as an "العروض" filter chip (badge=OFFER) —
// keep this route alive as a redirect so old bookmarks/links don't 404.
export default function OffersPage() {
  redirect("/shop?badge=OFFER");
}
