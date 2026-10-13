"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, Phone, X } from "lucide-react";
import { SidePanel } from "./side-panel";
import { SearchTrigger } from "./search-trigger";
import type { NavCategory } from "./site-nav";

const MENU_LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/shop", label: "جميع الأقسام" },
  { href: "/shop?badge=OFFER", label: "العروض" },
  { href: "/brands", label: "الشركات" },
  { href: "/cart", label: "السلة" },
  { href: "/about", label: "من نحن" },
  { href: "/support", label: "الدعم" },
];

/** Off-canvas mobile menu with "categories / menu" tabs, as on the reference store. */
export function MobileNav({
  categories,
  open,
  onClose,
  phoneDisplay,
  phoneHref,
}: {
  categories: NavCategory[];
  open: boolean;
  onClose: () => void;
  phoneDisplay: string;
  phoneHref: string;
}) {
  const [tab, setTab] = useState<"cats" | "menu">("cats");
  const linkCls = "flex min-h-[50px] items-center justify-between border-b border-ay-line px-5 text-[13px] font-semibold text-ay-title hover:text-ay-primary";

  return (
    <SidePanel open={open} onClose={onClose} side="start" width={300} label="القائمة">
      <div className="flex items-center justify-between border-b border-ay-line px-[15px] py-[10px]">
        <span className="text-[13px] font-semibold text-ay-title">القائمة</span>
        <button type="button" onClick={onClose} aria-label="إغلاق" className="grid size-8 place-items-center text-ay-title">
          <X className="size-5" />
        </button>
      </div>
      <div className="p-[15px]">
        <SearchTrigger inputId="mobile-drawer-search" onNavigate={onClose} />
      </div>
      <div className="grid grid-cols-2 border-b border-ay-line text-[13px] font-semibold">
        {(
          [
            ["cats", "الأقسام"],
            ["menu", "القائمة"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`relative h-[50px] transition-colors ${
              tab === key
                ? "bg-white text-ay-heading after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-ay-primary"
                : "bg-ay-page text-ay-title"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <nav className="flex-1 overflow-y-auto" aria-label={tab === "cats" ? "الأقسام" : "القائمة"}>
        {tab === "cats" ? (
          <ul key="cats" className="animate-ay-fade">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/category/${c.slug}`} onClick={onClose} className={linkCls}>
                  {c.nameAr}
                  <ChevronLeft className="size-4 opacity-50 ltr:rotate-180" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <ul key="menu" className="animate-ay-fade">
            {MENU_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={onClose} className={linkCls}>
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <a href={phoneHref} className={linkCls}>
                <span className="flex items-center gap-3">
                  <Phone className="size-[17px]" />
                  <span dir="ltr">{phoneDisplay}</span>
                </span>
              </a>
            </li>
          </ul>
        )}
      </nav>
    </SidePanel>
  );
}
