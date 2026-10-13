"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "./logout-button";

export interface NavItem {
  href: string;
  label: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export function AdminShell({
  groups,
  user,
  children,
}: {
  groups: NavGroup[];
  user: { name: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  const nav = (
    <nav aria-label="قائمة لوحة التحكم" className="flex flex-1 flex-col gap-4 overflow-y-auto">
      {groups.map((group) => (
        <div key={group.title} className="flex flex-col gap-1">
          <span className="px-2 text-[10.5px] font-semibold uppercase tracking-wide text-[#5e7ca4]">{group.title}</span>
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={`rounded-lg px-3 py-2.5 text-sm ${
                isActive(item.href) ? "bg-brand-action text-white" : "text-[#a9c2e0] hover:bg-[#0e2e52] hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col bg-bg-page md:flex-row" dir="rtl">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[200] focus:rounded-control focus:bg-brand-action focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">
        تخطي إلى المحتوى
      </a>

      <div className="flex items-center justify-between border-b border-border-light bg-brand-navy p-3 md:hidden">
        <span className="text-base font-bold text-white">Smart Line Admin</span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="admin-sidebar"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#1b4374] text-white"
        >
          <span className="sr-only">فتح القائمة</span>
          ☰
        </button>
      </div>

      <aside
        id="admin-sidebar"
        className={`${open ? "flex" : "hidden"} w-full flex-none flex-col gap-1 bg-brand-navy p-4 text-[#a9c2e0] md:flex md:w-[240px]`}
      >
        <span className="mb-4 hidden px-2 text-base font-bold text-white md:block">Smart Line Admin</span>
        {nav}
        <div className="mt-auto flex flex-col gap-2 border-t border-[#14375f] pt-3">
          <span className="px-2 text-xs text-[#7e9ac0]">{user.name}</span>
          <LogoutButton />
        </div>
      </aside>

      <main id="admin-main" className="min-w-0 flex-1 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
