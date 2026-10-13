"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  /** Route prefixes that should also activate this item (e.g. /category/* under Shop). */
  matchPrefixes?: string[];
}

export interface NavCategory {
  id: string;
  nameAr: string;
  slug: string;
}

// "جميع الأقسام" is just another entry point into the shop — it gets the same active
// treatment as any other item. Whichever item matches the current route (defaulting to
// "الرئيسية" on "/") is highlighted.
const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "الرئيسية" },
  { href: "/shop", label: "جميع الأقسام", matchPrefixes: ["/category", "/product"] },
  { href: "/brands", label: "الشركات" },
  { href: "/about", label: "من نحن" },
  { href: "/support", label: "الدعم" },
];

function isActive(item: NavItem, pathname: string): boolean {
  if (item.href === "/") return pathname === "/";
  if (pathname === item.href) return true;
  return item.matchPrefixes?.some((prefix) => pathname.startsWith(prefix)) ?? false;
}

export function SiteNav({ categories = [] }: { categories?: NavCategory[] }) {
  const pathname = usePathname();

  return (
    <ul className="flex items-center">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item, pathname);
        const withMenu = item.href === "/shop" && categories.length > 0;
        return (
          <li key={item.href} className={withMenu ? "ay-dropdown-host relative" : undefined}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex h-10 items-center gap-1 px-[10px] text-[13px] font-bold whitespace-nowrap transition-colors hover:text-ay-primary ${
                active ? "text-ay-primary" : "text-ay-title"
              }`}
            >
              {item.label}
              {withMenu && <ChevronDown className="size-3.5 opacity-60" />}
            </Link>
            {withMenu && (
              <div className="ay-dropdown start-0 top-full w-[560px] p-[25px]">
                <ul className="grid grid-cols-2 gap-x-6">
                  {categories.map((c) => (
                    <li key={c.id}>
                      <Link href={`/category/${c.slug}`} className="block py-[7px] text-[14px] text-ay-text hover:text-ay-primary">
                        {c.nameAr}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
