import { redirect } from "next/navigation";

// Support and Contact were merged into a single "/support" page — keep this route alive
// as a redirect so old bookmarks/links (including the footer's previous "تواصل معنا"
// link) don't 404.
export default function ContactPage() {
  redirect("/support");
}
